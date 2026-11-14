package com.gestion.commerciale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class FamilleDTO {

    private Integer id;

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Le libellé est obligatoire")
    @Size(max = 100)
    private String libelle;

    @Size(max = 255)
    private String description;

    private Boolean actif;

    private Integer entrepriseId;

    /** Inclus uniquement en lecture (GET) — ignoré à la création/màj. */
    private List<SousFamilleDTO> sousFamilles;

    private LocalDateTime dateCreation;
}