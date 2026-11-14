package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.MouvementStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Integer>,
        JpaSpecificationExecutor<MouvementStock> {

    Page<MouvementStock> findByArticleId(Integer articleId, Pageable pageable);
    Page<MouvementStock> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(m.article.code as code, m.article.designation as article, m.typeMouvement as type, " +
           "m.qte as quantite, m.stockAvant as stockAvant, m.stockApres as stockApres, " +
           "m.referenceDocument as reference, m.dateMouvement as date) FROM MouvementStock m " +
           "WHERE m.entreprise.id = :entrepriseId ORDER BY m.dateMouvement DESC")
    List<Map<String, Object>> findDerniers(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);
}
