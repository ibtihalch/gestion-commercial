package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonCommandeClient;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BonCommandeClientSpecification {

    public static Specification<BonCommandeClient> filtrer(
            Integer entrepriseId,
            String search,
            BonCommandeClient.Statut statut,
            Integer clientId,
            LocalDate dateDebut,
            LocalDate dateFin) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entrepriseId != null)
                predicates.add(cb.equal(root.get("entreprise").get("id"), entrepriseId));

            if (statut != null)
                predicates.add(cb.equal(root.get("statut"), statut));

            if (clientId != null)
                predicates.add(cb.equal(root.get("client").get("id"), clientId));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numero")), like),
                        cb.like(cb.lower(root.get("client").get("nom")), like)
                ));
            }

            if (dateDebut != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateCommande"), dateDebut));

            if (dateFin != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("dateCommande"), dateFin));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}