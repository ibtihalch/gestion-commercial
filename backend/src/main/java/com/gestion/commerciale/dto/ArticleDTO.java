package com.gestion.commerciale.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ArticleDTO {
    private Integer id;

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 50)
    private String code;

    private String designation;
    private String unite;

    @DecimalMin(value = "0.0")
    private BigDecimal prixAchat;

    @DecimalMin(value = "0.0")
    private BigDecimal prixVente;

    private BigDecimal stock;
    private Integer seuilAlerte;
    private Boolean actif;
    private Integer entrepriseId;

    // ── Famille ──────────────────────────────
    private Integer familleId;
    private String  familleLibelle;

    // ── Sous-famille ─────────────────────────
    private Integer sousFamilleId;
    private String  sousFamilleLibelle;

    private LocalDateTime dateCreation;
}