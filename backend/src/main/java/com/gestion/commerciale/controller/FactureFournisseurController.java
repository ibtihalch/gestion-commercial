package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.FactureFournisseurDTO;
import com.gestion.commerciale.entity.FactureFournisseur;
import com.gestion.commerciale.service.FactureFournisseurService;
import com.gestion.commerciale.service.impl.FactureFournisseurPdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/factures-fournisseur")
@RequiredArgsConstructor
@Tag(name = "Factures fournisseur")
@SecurityRequirement(name = "bearerAuth")
public class FactureFournisseurController {

    private final FactureFournisseurService    factureFournisseurService;
    private final FactureFournisseurPdfService factureFournisseurPdfService;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Lister les factures fournisseur (paginé, filtré)")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    Integer entrepriseId,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    FactureFournisseur.Statut statut,
            @RequestParam(required = false)    Integer fournisseurId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ok(factureFournisseurService.findAll(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une facture fournisseur par ID")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(factureFournisseurService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Créer une facture fournisseur")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody FactureFournisseurDTO dto,
            Authentication auth) {
        return ok(factureFournisseurService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une facture fournisseur")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody FactureFournisseurDTO dto,
            Authentication auth) {
        return ok(factureFournisseurService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'une facture fournisseur")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam FactureFournisseur.Statut statut) {
        return ok(factureFournisseurService.updateStatut(id, statut));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Supprimer une facture fournisseur")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        factureFournisseurService.delete(id);
        return deleted("Facture fournisseur supprimée");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Générer le PDF d'une facture fournisseur")
    public ResponseEntity<byte[]> getPdf(@PathVariable Integer id) {
        try {
            FactureFournisseurDTO dto = factureFournisseurService.findById(id);
            byte[] pdf = factureFournisseurPdfService.generatePdf(dto);

            String filename = "facture-fournisseur-" + dto.getNumero() + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

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