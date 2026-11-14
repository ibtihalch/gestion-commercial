package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.BonLivraisonDTO;
import com.gestion.commerciale.entity.BonLivraison;
import com.gestion.commerciale.service.BonLivraisonService;
import com.gestion.commerciale.service.impl.BonLivraisonPdfService;
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

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bons-livraison")
@RequiredArgsConstructor
@Tag(name = "Bons de livraison")
@SecurityRequirement(name = "bearerAuth")
public class BonLivraisonController {

    private final BonLivraisonService    bonLivraisonService;
    private final BonLivraisonPdfService bonLivraisonPdfService;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Lister les bons de livraison (paginé, filtré)")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    Integer entrepriseId,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    BonLivraison.Statut statut,
            @RequestParam(required = false)    Integer clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ok(bonLivraisonService.findAll(
                entrepriseId, search, statut, clientId, dateDebut, dateFin, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un bon de livraison par ID")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(bonLivraisonService.findById(id));
    }

    /**
     * Crée un BL et déclenche automatiquement la sortie de stock.
     * Lève 409 si le stock est insuffisant pour un article.
     */
    @PostMapping
    @Operation(summary = "Créer un bon de livraison (déclenche la sortie de stock)")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody BonLivraisonDTO dto,
            Authentication auth) {
        return ok(bonLivraisonService.create(dto, auth.getName()));
    }

    /**
     * Modifie un BL : restaure le stock de l'ancien BL, vérifie et déduit le nouveau.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Modifier un bon de livraison (recalcule les mouvements de stock)")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BonLivraisonDTO dto,
            Authentication auth) {
        return ok(bonLivraisonService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'un bon de livraison")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam BonLivraison.Statut statut) {
        return ok(bonLivraisonService.updateStatut(id, statut));
    }

    /**
     * Supprime un BL et restaure les quantités dans le stock.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Supprimer un bon de livraison (restaure le stock)")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        bonLivraisonService.delete(id);
        return deleted("Bon de livraison supprimé");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Générer le PDF d'un bon de livraison")
    public ResponseEntity<byte[]> getPdf(@PathVariable Integer id) throws IOException {
        BonLivraisonDTO bl  = bonLivraisonService.findById(id);
        byte[]          pdf = bonLivraisonPdfService.generatePdf(bl);

        String filename = "BL-" + bl.getNumero() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .body(pdf);
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