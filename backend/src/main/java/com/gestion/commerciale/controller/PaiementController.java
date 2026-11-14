package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.PaiementDTO;
import com.gestion.commerciale.service.PaiementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Paiements", description = "Gestion des paiements des factures client et fournisseur")
@SecurityRequirement(name = "bearerAuth")
public class PaiementController {

    private final PaiementService paiementService;

    // ─────────────────────────────────────────────────────────────────────────
    // FACTURE CLIENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/factures-client/{id}/payer
     * Enregistre un paiement sur une facture client.
     * Rôles autorisés : ADMIN, VENDEUR
     */
    @PostMapping("/api/factures-client/{id}/payer")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEUR')")
    @Operation(summary = "Payer une facture client",
               description = "Enregistre un paiement. La facture passe automatiquement à 'payee' si le total atteint le montant TTC.")
    public ResponseEntity<Map<String, Object>> payerFactureClient(
            @PathVariable Integer id,
            @Valid @RequestBody PaiementDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        PaiementDTO result = paiementService.payerFactureClient(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "data", result));
    }

    /**
     * GET /api/factures-client/{id}/paiements
     * Historique des paiements d'une facture client.
     * Rôles autorisés : ADMIN, VENDEUR, CONSULTANT
     */
    @GetMapping("/api/factures-client/{id}/paiements")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEUR','CONSULTANT')")
    @Operation(summary = "Historique paiements facture client",
               description = "Retourne tous les paiements enregistrés pour une facture client, triés du plus récent au plus ancien.")
    public ResponseEntity<Map<String, Object>> getHistoriqueFactureClient(
            @PathVariable Integer id) {

        List<PaiementDTO> historique = paiementService.getHistoriqueFactureClient(id);
        return ResponseEntity.ok(Map.of("success", true, "data", historique));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FACTURE FOURNISSEUR
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/factures-fournisseur/{id}/payer
     * Enregistre un paiement sur une facture fournisseur.
     * Rôles autorisés : ADMIN, ACHETEUR
     */
    @PostMapping("/api/factures-fournisseur/{id}/payer")
    @PreAuthorize("hasAnyRole('ADMIN','ACHETEUR')")
    @Operation(summary = "Payer une facture fournisseur",
               description = "Enregistre un paiement. La facture passe automatiquement à 'payee' si le total atteint le montant TTC.")
    public ResponseEntity<Map<String, Object>> payerFactureFournisseur(
            @PathVariable Integer id,
            @Valid @RequestBody PaiementDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        PaiementDTO result = paiementService.payerFactureFournisseur(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "data", result));
    }

    /**
     * GET /api/factures-fournisseur/{id}/paiements
     * Historique des paiements d'une facture fournisseur.
     * Rôles autorisés : ADMIN, ACHETEUR, CONSULTANT
     */
    @GetMapping("/api/factures-fournisseur/{id}/paiements")
    @PreAuthorize("hasAnyRole('ADMIN','ACHETEUR','CONSULTANT')")
    @Operation(summary = "Historique paiements facture fournisseur",
               description = "Retourne tous les paiements enregistrés pour une facture fournisseur, triés du plus récent au plus ancien.")
    public ResponseEntity<Map<String, Object>> getHistoriqueFactureFournisseur(
            @PathVariable Integer id) {

        List<PaiementDTO> historique = paiementService.getHistoriqueFactureFournisseur(id);
        return ResponseEntity.ok(Map.of("success", true, "data", historique));
    }
}