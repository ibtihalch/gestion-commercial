package com.gestion.commerciale.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

@Data
public class RegisterRequest {
    @NotBlank(message = "Le login est obligatoire")
    @Size(min = 3, max = 50, message = "Le login doit avoir entre 3 et 50 caractères")
    private String login;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit avoir au moins 6 caractères")
    private String motDePasse;

    private String nom;
    private String prenom;
    private String telephone;

    @Email(message = "Email invalide")
    private String email;

    private Integer entrepriseId;

    private Set<String> roles;
}
