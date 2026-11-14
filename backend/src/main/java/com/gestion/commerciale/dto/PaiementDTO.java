package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.Paiement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class PaiementDTO {

    private Integer id;

    // ── Liens facture (retour lecture seulement) ──────────────────────────────
    private Integer factureClientId;
    private String  factureClientNumero;

    private Integer factureFournisseurId;
    private String  factureFournisseurNumero;

    // ── Champs obligatoires à la création ─────────────────────────────────────
    @NotNull(message = "La date de paiement est obligatoire")
    private LocalDate datePaiement;

    @NotNull(message = "Le mode de paiement est obligatoire")
    private Paiement.ModePaiement modePaiement;

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant doit être positif")
    private BigDecimal montant;

    // ── Champs optionnels ─────────────────────────────────────────────────────
    private String reference;
    private String remarque;

    // ── Traçabilité (retour lecture seulement) ────────────────────────────────
    private Integer       valideParId;
    private String        valideParLogin;
    private String        valideParNom;
    private LocalDateTime dateCreation;
}