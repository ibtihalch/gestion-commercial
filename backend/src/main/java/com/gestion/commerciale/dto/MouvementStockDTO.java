package com.gestion.commerciale.dto;

import com.gestion.commerciale.entity.MouvementStock;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class MouvementStockDTO {
    private Integer id;

    @NotNull(message = "L'article est obligatoire")
    private Integer articleId;
    private String articleCode;
    private String articleDesignation;

    @NotNull(message = "Le type est obligatoire")
    private MouvementStock.TypeMouvement typeMouvement;

    @NotNull @DecimalMin("0.001")
    private BigDecimal qte;

    private BigDecimal stockAvant;
    private BigDecimal stockApres;
    private String referenceDocument;
    private String observations;
    private Integer entrepriseId;
    private LocalDateTime dateMouvement;
}
