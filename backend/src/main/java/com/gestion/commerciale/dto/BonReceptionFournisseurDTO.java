package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.BonReceptionFournisseur;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class BonReceptionFournisseurDTO {
    private Integer id;
    private String numero;

    @NotNull(message = "Le fournisseur est obligatoire")
    private Integer fournisseurId;
    private String fournisseurNom;
    private String fournisseurIce; 
    private String fournisseurTelephone;  // ← ajouter (optionnel)
    private String fournisseurEmail;      // ← ajouter (optionnel)
    private String fournisseurAdresse;    // ← ajouter (optionnel)

    private Integer affaireId;
    private String affaireNom;
    private Integer bonCommandeFournisseurId;
    private String bonCommandeFournisseurNumero; 
    

    @NotNull(message = "La date est obligatoire")
    private LocalDate dateReception;

    private BonReceptionFournisseur.Statut statut;
    private String observations;
    private Integer utilisateurId;
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
        @NotNull @Min(1)
        private Integer qte;
        @NotNull @DecimalMin("0.01")
        private BigDecimal prixUnitaire;
        private BigDecimal montant;
    }
}
