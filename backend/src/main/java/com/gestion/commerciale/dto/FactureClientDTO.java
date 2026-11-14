package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.FactureClient;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class FactureClientDTO {
    private Integer id;
    private String numero;

    @NotNull(message = "Le client est obligatoire")
    private Integer clientId;
    private String clientNom;
    private String clientIce;
    private String clientTelephone;
    private String clientEmail;
    private String clientAdresse;

    private Integer affaireId;
    private String  affaireNom;
    private Integer bonLivraisonId;
    private String  bonLivraisonNumero;   // ← AJOUTÉ

    @NotNull(message = "La date est obligatoire")
    private LocalDate dateFacture;

    private LocalDate             dateEcheance;
    private FactureClient.Statut  statut;
    private BigDecimal            montantHt;
    private BigDecimal            tva;
    private BigDecimal            montantTtc;
    private String                observations;
    private Integer               utilisateurId;
    private Integer               entrepriseId;
    private LocalDateTime         dateCreation;

    private List<DetailDTO> details;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class DetailDTO {
        private Integer    id;
        private Integer    articleId;
        private String     articleCode;
        private String     articleDesignation;
        private String articleUnite;
        @NotNull @Min(1)
        private Integer    qte;
        @NotNull @DecimalMin("0.01")
        private BigDecimal prixUnitaire;
        private BigDecimal montant;
    }
}