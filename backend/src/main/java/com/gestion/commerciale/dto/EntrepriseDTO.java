package com.gestion.commerciale.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class EntrepriseDTO {
    private Integer id;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String responsable;
    private String adresse;
    private String telephone;
    private String fax;
    private String email;
    private String ice;
    private String ifiscale;
    private String cnss;
    private String patente;
    private String rc;
    private String compteBancaire;
    private String siteWeb;
    private String logo;
    private String description;
    private LocalDateTime dateCreation;
}
