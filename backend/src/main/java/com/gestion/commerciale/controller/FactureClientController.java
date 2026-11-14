package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.FactureClientDTO;
import com.gestion.commerciale.entity.FactureClient;
import com.gestion.commerciale.service.FactureClientService;
import com.gestion.commerciale.service.impl.FactureClientPdfService;
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

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/factures-client")
@RequiredArgsConstructor
@Tag(name = "Factures client")
@SecurityRequirement(name = "bearerAuth")
public class FactureClientController {

    private final FactureClientService    factureClientService;
    private final FactureClientPdfService factureClientPdfService;

    // ── CRUD de base ─────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int                  page,
            @RequestParam(defaultValue = "10") int                  size,
            @RequestParam(required = false)    Integer              entrepriseId,
            @RequestParam(required = false)    String               search,
            @RequestParam(required = false)    FactureClient.Statut statut,
            @RequestParam(required = false)    Integer              clientId,
            @RequestParam(required = false)    String               dateDebut,
            @RequestParam(required = false)    String               dateFin) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by("dateCreation").descending());

        LocalDate debut = (dateDebut != null && !dateDebut.isBlank())
                ? LocalDate.parse(dateDebut) : null;
        LocalDate fin   = (dateFin   != null && !dateFin.isBlank())
                ? LocalDate.parse(dateFin)   : null;

        return ok(factureClientService.findAll(
                entrepriseId, search, statut, clientId, debut, fin, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(factureClientService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody FactureClientDTO dto,
            Authentication auth) {
        return ok(factureClientService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody FactureClientDTO dto,
            Authentication auth) {
        return ok(factureClientService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam FactureClient.Statut statut) {
        return ok(factureClientService.updateStatut(id, statut));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        factureClientService.delete(id);
        return deleted("Facture supprimée");
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getPdf(@PathVariable Integer id) throws IOException {
        FactureClientDTO dto = factureClientService.findById(id);
        byte[] pdf = factureClientPdfService.generatePdf(dto);

        String filename = "FC_" + dto.getNumero() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + filename + "\"")
                .body(pdf);
    }

    // ── Statistiques ─────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(required = false) Integer entrepriseId) {

        BigDecimal impayees = factureClientService.sumImpayees(entrepriseId);
        BigDecimal payees   = factureClientService.sumPayees(entrepriseId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalImpayees", impayees);
        stats.put("totalPayees",   payees);
        stats.put("totalGeneral",  impayees.add(payees));

        return ok(stats);
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