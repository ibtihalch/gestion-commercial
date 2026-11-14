package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.BonLivraison;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class BonLivraisonDTO {
    private Integer id;
    private String numero;

    @NotNull(message = "Le client est obligatoire")
    private Integer clientId;
    private String clientNom;
private String clientIce;        // ← ajouter
private String clientTelephone;  // ← ajouter (optionnel)
private String clientEmail;      // ← ajouter (optionnel)
private String clientAdresse;    // ← ajouter (optionnel)
    private Integer affaireId;
    private String affaireNom;
    private Integer bonCommandeClientId;
    private String bonCommandeClientNumero; // ← AJOUTÉ

    @NotNull(message = "La date est obligatoire")
    private LocalDate dateLivraison;

    private BonLivraison.Statut statut;
    private String observations;
    private Integer utilisateurId;
    private BigDecimal montantHt;
    private BigDecimal tva;
    private BigDecimal montantTtc;
    private Integer entrepriseId;
    private LocalDateTime dateCreation;

    private List<DetailDTO> details;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class DetailDTO {
        private Integer id;
        private Integer articleId;
        private String articleCode;
        private String articleDesignation;
        private String articleUnite;
        @NotNull @DecimalMin("0.001")
        private BigDecimal qte;
        @NotNull @DecimalMin("0.01")
        private BigDecimal prixUnitaire;
        private BigDecimal montant;
    }
}
