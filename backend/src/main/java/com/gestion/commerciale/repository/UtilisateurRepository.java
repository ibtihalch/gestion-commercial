package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {

    /** Vérifie l'existence par login (unicité). */
    boolean existsByLogin(String login);

    /**
     * Vérifie l'existence par email (unicité).
     * CORRECTION : méthode ajoutée pour éviter une exception SQL non gérée
     * en cas de doublon d'email.
     */
    boolean existsByEmail(String email);

    /** Recherche par login (utilisé par Spring Security). */
    Optional<Utilisateur> findByLogin(String login);
}