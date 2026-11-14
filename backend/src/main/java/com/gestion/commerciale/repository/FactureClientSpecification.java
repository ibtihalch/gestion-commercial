package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.FactureClient;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FactureClientSpecification {

    public static Specification<FactureClient> filtrer(
            Integer entrepriseId,
            String search,
            FactureClient.Statut statut,
            Integer clientId,
            LocalDate dateDebut,
            LocalDate dateFin) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Entreprise — toujours appliqué si fourni
            if (entrepriseId != null) {
                predicates.add(cb.equal(root.get("entreprise").get("id"), entrepriseId));
            }

            // Statut exact
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }

            // Client exact
            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }

            // Recherche texte : numéro OU nom client
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                Predicate byNumero = cb.like(cb.lower(root.get("numero")), like);
                Predicate byClient = cb.like(cb.lower(root.get("client").get("nom")), like);
                predicates.add(cb.or(byNumero, byClient));
            }

            // Date début (dateFacture >= dateDebut)
            if (dateDebut != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateFacture"), dateDebut));
            }

            // Date fin (dateFacture <= dateFin)
            if (dateFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dateFacture"), dateFin));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}