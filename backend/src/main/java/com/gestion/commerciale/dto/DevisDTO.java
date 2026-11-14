package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.Devis;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class DevisDTO {

    private Integer id;
    private String  numero;

    @NotNull(message = "Le client est obligatoire")
    private Integer clientId;
    private String  clientNom;
    private String  clientIce;
    private String  clientTelephone;
    private String  clientEmail;
    private String  clientAdresse;

    private Integer affaireId;
    private String  affaireNom;

    @NotNull(message = "La date est obligatoire")
    private LocalDate dateDevis;

    private LocalDate         dateValidite;
    private Devis.StatutDevis statut;
    private BigDecimal        montantHt;
    private BigDecimal        tva;
    private BigDecimal        montantTtc;
    private String            observations;
    private String            conditionsPaiement;
    private Integer           utilisateurId;
    private Integer           entrepriseId;
    private LocalDateTime     dateCreation;

    private List<DevisDetailDTO> details;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class DevisDetailDTO {
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