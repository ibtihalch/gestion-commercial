package com.gestion.commerciale.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** Utilisé pour les ressources identifiées par un ID numérique. */
    public ResourceNotFoundException(String resource, Integer id) {
        super(resource + " introuvable avec l'id : " + id);
    }

    /** Utilisé pour les ressources identifiées par un nom/code (ex : rôle). */
    public ResourceNotFoundException(String resource, String identifier) {
        super(resource + " introuvable : " + identifier);
    }
}