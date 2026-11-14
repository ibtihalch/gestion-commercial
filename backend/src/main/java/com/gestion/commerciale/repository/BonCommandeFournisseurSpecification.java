package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonCommandeFournisseur;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class BonCommandeFournisseurSpecification {

    public static Specification<BonCommandeFournisseur> filtrer(
            Integer entrepriseId,
            String search,
            BonCommandeFournisseur.Statut statut,
            Integer fournisseurId,
            LocalDate dateDebut,
            LocalDate dateFin) {

        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (entrepriseId != null)
                predicates.add(cb.equal(root.get("entreprise").get("id"), entrepriseId));

            if (statut != null)
                predicates.add(cb.equal(root.get("statut"), statut));

            if (fournisseurId != null)
                predicates.add(cb.equal(root.get("fournisseur").get("id"), fournisseurId));

            if (dateDebut != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateCommande"), dateDebut));

            if (dateFin != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dateCommande"), dateFin));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numero")), like),
                        cb.like(cb.lower(root.get("fournisseur").get("nom")), like)
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}