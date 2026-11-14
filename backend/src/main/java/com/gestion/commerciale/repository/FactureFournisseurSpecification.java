package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.FactureFournisseur;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;

public class FactureFournisseurSpecification {

    public static Specification<FactureFournisseur> filtrer(
            Integer entrepriseId,
            String search,
            FactureFournisseur.Statut statut,
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
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateFacture"), dateDebut));

            if (dateFin != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dateFacture"), dateFin));

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