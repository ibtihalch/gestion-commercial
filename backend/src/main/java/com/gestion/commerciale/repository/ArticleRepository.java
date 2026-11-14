package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Integer>,
        JpaSpecificationExecutor<Article> {

    Page<Article> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    boolean existsByCode(String code);

    @Query("SELECT a FROM Article a WHERE a.stock <= a.seuilAlerte AND a.actif = true")
    List<Article> findArticlesSousSeuilAlerte();

    long countByEntrepriseId(Integer entrepriseId);
    long countByFamilleId(Integer familleId);
    long countBySousFamilleId(Integer sousFamilleId);

    long countByActifTrue();
    long countByEntrepriseIdAndActifTrue(Integer entrepriseId);
    Page<Article> findByEntrepriseIdAndActifTrueOrderByDesignationAsc(Integer entrepriseId, Pageable pageable);

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    @Query("SELECT new map(a.code as code, a.designation as designation, a.stock as stock, a.seuilAlerte as seuilAlerte) " +
           "FROM Article a WHERE a.entreprise.id = :entrepriseId AND a.actif = true " +
           "AND a.stock <= a.seuilAlerte ORDER BY a.stock ASC")
    List<Map<String, Object>> findArticlesSousSeuilAlerteByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(a.code as code, a.designation as designation, a.stock as stock, " +
           "a.seuilAlerte as seuilAlerte, a.unite as unite, a.prixAchat as prixAchat, " +
           "a.prixVente as prixVente, a.actif as actif) FROM Article a " +
           "WHERE a.entreprise.id = :entrepriseId AND UPPER(a.code) = UPPER(:code)")
    Optional<Map<String, Object>> findInfosByCode(@Param("entrepriseId") Integer entrepriseId,
                                                  @Param("code") String code);
}
