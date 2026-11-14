package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonReceptionFournisseur;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import jakarta.persistence.criteria.Predicate;

public class BonReceptionFournisseurSpecification {

    public static Specification<BonReceptionFournisseur> filtrer(
            Integer entrepriseId,
            String search,
            BonReceptionFournisseur.Statut statut,
            Integer fournisseurId,
            LocalDate dateDebut,
            LocalDate dateFin) {

        return (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (entrepriseId != null)
                predicates.add(cb.equal(root.get("entreprise").get("id"), entrepriseId));

            if (statut != null)
                predicates.add(cb.equal(root.get("statut"), statut));

            if (fournisseurId != null)
                predicates.add(cb.equal(root.get("fournisseur").get("id"), fournisseurId));

            if (dateDebut != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateReception"), dateDebut));

            if (dateFin != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dateReception"), dateFin));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numero")), like),
                        cb.like(cb.lower(root.get("fournisseur").get("nom")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}