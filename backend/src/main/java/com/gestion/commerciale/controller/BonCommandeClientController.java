package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.BonCommandeClientDTO;
import com.gestion.commerciale.entity.BonCommandeClient;
import com.gestion.commerciale.service.BonCommandeClientService;
import com.gestion.commerciale.service.impl.BonCommandeClientPdfService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bons-commande-client")
@RequiredArgsConstructor
@Tag(name = "Bons de commande client")
@SecurityRequirement(name = "bearerAuth")
public class BonCommandeClientController {

    private final BonCommandeClientService    bonCommandeClientService;
    private final BonCommandeClientPdfService bonCommandeClientPdfService;

    // ── LISTE avec filtres ────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int                       page,
            @RequestParam(defaultValue = "10") int                       size,
            @RequestParam(required = false)    Integer                   entrepriseId,
            @RequestParam(required = false)    String                    search,
            @RequestParam(required = false)    BonCommandeClient.Statut  statut,
            @RequestParam(required = false)    Integer                   clientId,
            @RequestParam(required = false)    String                    dateDebut,
            @RequestParam(required = false)    String                    dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());

        LocalDate debut = (dateDebut != null && !dateDebut.isBlank()) ? LocalDate.parse(dateDebut) : null;
        LocalDate fin   = (dateFin   != null && !dateFin.isBlank())   ? LocalDate.parse(dateFin)   : null;

        return ok(bonCommandeClientService.findAll(
                entrepriseId, search, statut, clientId, debut, fin, pageable));
    }

    // ── DÉTAIL ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(bonCommandeClientService.findById(id));
    }

    // ── CRÉATION ──────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody BonCommandeClientDTO dto,
            Authentication auth) {
        return ok(bonCommandeClientService.create(dto, auth.getName()));
    }

    // ── MISE À JOUR ───────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BonCommandeClientDTO dto,
            Authentication auth) {
        return ok(bonCommandeClientService.update(id, dto, auth.getName()));
    }

    // ── CHANGEMENT DE STATUT ──────────────────────────────────────────────────

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam BonCommandeClient.Statut statut) {
        return ok(bonCommandeClientService.updateStatut(id, statut));
    }

    // ── SUPPRESSION ───────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        bonCommandeClientService.delete(id);
        return deleted("Bon de commande supprimé");
    }

    // ── EXPORT PDF ────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Integer id) throws IOException {
        BonCommandeClientDTO bc  = bonCommandeClientService.findById(id);
        byte[]               pdf = bonCommandeClientPdfService.generatePdf(bc);

        String filename = "BC-" + bc.getNumero() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(pdf.length);

        return ResponseEntity.ok().headers(headers).body(pdf);
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