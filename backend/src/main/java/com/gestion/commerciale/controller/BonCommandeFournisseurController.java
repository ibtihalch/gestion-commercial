package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.BonCommandeFournisseurDTO;
import com.gestion.commerciale.entity.BonCommandeFournisseur;
import com.gestion.commerciale.service.BonCommandeFournisseurService;
import com.gestion.commerciale.service.impl.BonCommandeFournisseurPdfService;
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
@RequestMapping("/api/bons-commande-fournisseur")
@RequiredArgsConstructor
@Tag(name = "Bons de commande fournisseur")
@SecurityRequirement(name = "bearerAuth")
public class BonCommandeFournisseurController {

    private final BonCommandeFournisseurService    bonCommandeFournisseurService;
    private final BonCommandeFournisseurPdfService bonCommandeFournisseurPdfService;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Lister les bons de commande fournisseur (paginé, filtré)")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    Integer entrepriseId,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    BonCommandeFournisseur.Statut statut,
            @RequestParam(required = false)    Integer fournisseurId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ok(bonCommandeFournisseurService.findAll(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un bon de commande fournisseur par ID")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(bonCommandeFournisseurService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Créer un bon de commande fournisseur")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody BonCommandeFournisseurDTO dto,
            Authentication auth) {
        return ok(bonCommandeFournisseurService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un bon de commande fournisseur")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BonCommandeFournisseurDTO dto,
            Authentication auth) {
        return ok(bonCommandeFournisseurService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'un bon de commande fournisseur")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam BonCommandeFournisseur.Statut statut) {
        return ok(bonCommandeFournisseurService.updateStatut(id, statut));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Supprimer un bon de commande fournisseur")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        bonCommandeFournisseurService.delete(id);
        return deleted("Bon de commande supprimé");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Générer le PDF d'un bon de commande fournisseur")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Integer id) {
        try {
            BonCommandeFournisseurDTO dto = bonCommandeFournisseurService.findById(id);
            byte[] pdf = bonCommandeFournisseurPdfService.generatePdf(dto);

            String filename = "BCF-" + dto.getNumero() + ".pdf";

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