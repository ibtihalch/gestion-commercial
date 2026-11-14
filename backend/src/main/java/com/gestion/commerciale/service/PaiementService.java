package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.PaiementDTO;

import java.util.List;

public interface PaiementService {

    // ── Facture Client ────────────────────────────────────────────────────────

    /**
     * Enregistre un paiement sur une facture client.
     * Si le montant total payé >= montantTtc, la facture passe automatiquement à "payee".
     */
    PaiementDTO payerFactureClient(Integer factureClientId,
                                   PaiementDTO dto,
                                   String loginUtilisateur);

    /**
     * Retourne l'historique des paiements d'une facture client.
     */
    List<PaiementDTO> getHistoriqueFactureClient(Integer factureClientId);

    // ── Facture Fournisseur ───────────────────────────────────────────────────

    /**
     * Enregistre un paiement sur une facture fournisseur.
     * Si le montant total payé >= montantTtc, la facture passe automatiquement à "payee".
     */
    PaiementDTO payerFactureFournisseur(Integer factureFournisseurId,
                                        PaiementDTO dto,
                                        String loginUtilisateur);

    /**
     * Retourne l'historique des paiements d'une facture fournisseur.
     */
    List<PaiementDTO> getHistoriqueFactureFournisseur(Integer factureFournisseurId);
}