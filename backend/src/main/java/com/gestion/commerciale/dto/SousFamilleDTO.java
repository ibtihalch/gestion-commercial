package com.gestion.commerciale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SousFamilleDTO {

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

    @NotNull(message = "L'identifiant de la famille est obligatoire")
    private Integer familleId;

    /** Inclus en lecture pour afficher le libellé parent sans appel supplémentaire. */
    private String familleLibelle;

    private LocalDateTime dateCreation;
}