package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.DevisDTO;
import com.gestion.commerciale.entity.Devis;
import com.gestion.commerciale.service.DevisService;
import com.gestion.commerciale.service.impl.DevisPdfService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/devis")
@RequiredArgsConstructor
@Tag(name = "Devis")
@SecurityRequirement(name = "bearerAuth")
public class DevisController {

    private final DevisService    devisService;
    private final DevisPdfService devisPdfService;

    // ── Liste avec filtres ────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int                page,
            @RequestParam(defaultValue = "10") int                size,
            @RequestParam(required = false)    Integer            entrepriseId,
            @RequestParam(required = false)    String             search,
            @RequestParam(required = false)    Devis.StatutDevis  statut,
            @RequestParam(required = false)    Integer            clientId,
            @RequestParam(required = false)    String             dateDebut,
            @RequestParam(required = false)    String             dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());

        LocalDate debut = (dateDebut != null && !dateDebut.isBlank()) ? LocalDate.parse(dateDebut) : null;
        LocalDate fin   = (dateFin   != null && !dateFin.isBlank())   ? LocalDate.parse(dateFin)   : null;

        return ok(devisService.findAll(entrepriseId, search, statut, clientId, debut, fin, pageable));
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(devisService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody DevisDTO dto,
                                                       Authentication auth) {
        return ok(devisService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody DevisDTO dto,
                                                       Authentication auth) {
        return ok(devisService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Map<String, Object>> updateStatut(@PathVariable Integer id,
                                                             @RequestParam Devis.StatutDevis statut) {
        return ok(devisService.updateStatut(id, statut));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        devisService.delete(id);
        return deleted("Devis supprimé");
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getPdf(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "false") boolean inline) {

        try {
            DevisDTO devis = devisService.findById(id);
            byte[]   pdf   = devisPdfService.generateDevisPdf(devis);

            String filename    = "devis-" + devis.getNumero() + ".pdf";
            String disposition = inline
                    ? "inline; filename=\"" + filename + "\""
                    : "attachment; filename=\"" + filename + "\"";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    private ResponseEntity<Map<String, Object>> deleted(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", message);
        return ResponseEntity.ok(body);
    }
}