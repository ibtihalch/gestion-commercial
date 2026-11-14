package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonLivraison;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BonLivraisonRepository extends JpaRepository<BonLivraison, Integer>,
        JpaSpecificationExecutor<BonLivraison> {

    Page<BonLivraison> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COUNT(b) FROM BonLivraison b WHERE b.entreprise.id = :entrepriseId " +
       "AND b.statut = com.gestion.commerciale.entity.BonLivraison$Statut.en_cours")
long countEnCoursByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, b.dateLivraison as date, " +
           "b.statut as statut, b.montantTtc as montant) FROM BonLivraison b " +
           "WHERE b.entreprise.id = :entrepriseId ORDER BY b.dateLivraison DESC")
    List<Map<String, Object>> findDernieres(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, a.nom as affaire, " +
           "b.dateLivraison as dateLivraison, b.statut as statut, b.montantHt as montantHt, " +
           "b.tva as tva, b.montantTtc as montantTtc, b.observations as observations) " +
           "FROM BonLivraison b LEFT JOIN b.affaire a WHERE b.entreprise.id = :entrepriseId AND UPPER(b.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM BonLivraisonDetail d " +
           "WHERE d.bonLivraison.entreprise.id = :entrepriseId AND UPPER(d.bonLivraison.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);
}
