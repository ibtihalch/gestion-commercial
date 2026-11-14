package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Article;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications JPA pour filtrer les articles dynamiquement.
 * Usage :
 * <pre>
 *   Specification&lt;Article&gt; spec = ArticleSpecification.build(entrepriseId, familleId, sousFamilleId, search, actifOnly);
 *   articleRepository.findAll(spec, pageable);
 * </pre>
 */
public final class ArticleSpecification {

    private ArticleSpecification() {}

    /**
     * Construit une {@link Specification} combinant tous les critères fournis.
     * Les paramètres {@code null} sont ignorés (pas de filtre appliqué).
     *
     * @param entrepriseId   filtre par entreprise    (optionnel)
     * @param familleId      filtre par famille       (optionnel)
     * @param sousFamilleId  filtre par sous-famille  (optionnel)
     * @param search         recherche libre sur code ou désignation (optionnel)
     * @param actifOnly      si true, retourne uniquement les articles actifs (optionnel)
     */
    public static Specification<Article> build(
            Integer entrepriseId,
            Integer familleId,
            Integer sousFamilleId,
            String search,
            Boolean actifOnly) {  // ← nouveau

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entrepriseId != null) {
                predicates.add(cb.equal(root.get("entreprise").get("id"), entrepriseId));
            }

            if (familleId != null) {
                predicates.add(cb.equal(root.get("famille").get("id"), familleId));
            }

            if (sousFamilleId != null) {
                predicates.add(cb.equal(root.get("sousFamille").get("id"), sousFamilleId));
            }

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), like),
                        cb.like(cb.lower(root.get("designation")), like)
                ));
            }

            // ← nouveau
            if (Boolean.TRUE.equals(actifOnly)) {
                predicates.add(cb.isTrue(root.get("actif")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}