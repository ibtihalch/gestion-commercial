package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.BonReceptionFournisseurDTO;
import com.gestion.commerciale.entity.BonReceptionFournisseur;
import com.gestion.commerciale.service.BonReceptionFournisseurService;
import com.gestion.commerciale.service.impl.BonReceptionFournisseurPdfService;
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
@RequestMapping("/api/bons-reception-fournisseur")
@RequiredArgsConstructor
@Tag(name = "Bons de réception fournisseur")
@SecurityRequirement(name = "bearerAuth")
public class BonReceptionFournisseurController {

    private final BonReceptionFournisseurService    bonReceptionFournisseurService;
    private final BonReceptionFournisseurPdfService bonReceptionFournisseurPdfService;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Lister les bons de réception fournisseur (paginé, filtré)")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    Integer entrepriseId,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    BonReceptionFournisseur.Statut statut,
            @RequestParam(required = false)    Integer fournisseurId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ok(bonReceptionFournisseurService.findAll(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un bon de réception fournisseur par ID")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(bonReceptionFournisseurService.findById(id));
    }

    /**
     * Crée un BR et déclenche automatiquement l'entrée de stock.
     */
    @PostMapping
    @Operation(summary = "Créer un bon de réception fournisseur (déclenche l'entrée de stock)")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody BonReceptionFournisseurDTO dto,
            Authentication auth) {
        return ok(bonReceptionFournisseurService.create(dto, auth.getName()));
    }

    /**
     * Modifie un BR : annule les mouvements de l'ancien BR, recalcule et applique les nouveaux.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Modifier un bon de réception fournisseur (recalcule les mouvements de stock)")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BonReceptionFournisseurDTO dto,
            Authentication auth) {
        return ok(bonReceptionFournisseurService.update(id, dto, auth.getName()));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'un bon de réception fournisseur")
    public ResponseEntity<Map<String, Object>> updateStatut(
            @PathVariable Integer id,
            @RequestParam BonReceptionFournisseur.Statut statut) {
        return ok(bonReceptionFournisseurService.updateStatut(id, statut));
    }

    /**
     * Supprime un BR et retire les quantités du stock.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Supprimer un bon de réception fournisseur (retire du stock)")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        bonReceptionFournisseurService.delete(id);
        return deleted("Bon de réception supprimé");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Générer le PDF d'un bon de réception fournisseur")
    public ResponseEntity<byte[]> getPdf(@PathVariable Integer id) throws IOException {
        BonReceptionFournisseurDTO br  = bonReceptionFournisseurService.findById(id);
        byte[]                     pdf = bonReceptionFournisseurPdfService.generatePdf(br);

        String filename = "BRF-" + br.getNumero() + ".pdf";

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