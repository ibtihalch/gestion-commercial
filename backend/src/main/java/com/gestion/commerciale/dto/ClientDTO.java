package com.gestion.commerciale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ClientDTO {
    private Integer id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100)
    private String nom;

    @Size(max = 200)
    private String adresse;

    @Size(max = 20)
    private String telephone;

    private String email;
    private Boolean actif;
    private String ice;
    private Integer entrepriseId;
    private String entrepriseNom;
    private LocalDateTime dateCreation;
}
