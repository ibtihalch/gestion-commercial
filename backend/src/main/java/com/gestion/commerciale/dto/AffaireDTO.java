package com.gestion.commerciale.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AffaireDTO {
    private Integer id;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String description;
    private Boolean actif;
    private Integer entrepriseId;
    private String entrepriseNom;
    private LocalDateTime dateCreation;
}
