package com.gestion.commerciale.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurDTO {

    /** Identifiant — null à la création, renseigné en lecture. */
    private Integer id;
    // Ajouter dans la section Relations
private ProfilDTO profil;

    // -------------------------------------------------------------------------
    // Identifiants de connexion
    // -------------------------------------------------------------------------

    @NotBlank(message = "Le login est obligatoire")
    @Size(min = 3, max = 50, message = "Le login doit contenir entre 3 et 50 caractères")
    private String login;

    /**
     * Mot de passe en clair.
     * CORRECTION :
     *  - @JsonProperty(WRITE_ONLY) : jamais sérialisé dans les réponses JSON.
     *  - Obligatoire uniquement à la création (validé dans le service).
     */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    // -------------------------------------------------------------------------
    // Informations personnelles
    // -------------------------------------------------------------------------

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    private String prenom;

    @Size(max = 20, message = "Le téléphone ne peut pas dépasser 20 caractères")
    private String telephone;

    // CORRECTION : validation de format d'email
    @Email(message = "Format d'email invalide")
    @Size(max = 100, message = "L'email ne peut pas dépasser 100 caractères")
    private String email;

    // -------------------------------------------------------------------------
    // État du compte
    // -------------------------------------------------------------------------

    private Boolean actif;

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    private Integer entrepriseId;

    /** Nom de l'entreprise — lecture seule, ignoré à l'écriture. */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String entrepriseNom;

    /**
     * Noms des rôles (ex : "ROLE_ADMIN", "ROLE_USER").
     * Une liste vide est acceptée pour retirer tous les rôles lors d'un update.
     */
    private Set<String> roles;

    // -------------------------------------------------------------------------
    // Métadonnées — lecture seule
    // -------------------------------------------------------------------------

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime dateCreation;
}