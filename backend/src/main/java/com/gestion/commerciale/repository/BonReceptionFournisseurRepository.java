package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonReceptionFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BonReceptionFournisseurRepository extends JpaRepository<BonReceptionFournisseur, Integer>,
        JpaSpecificationExecutor<BonReceptionFournisseur> {

    Page<BonReceptionFournisseur> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COUNT(b) FROM BonReceptionFournisseur b WHERE b.entreprise.id = :entrepriseId " +
       "AND b.statut = com.gestion.commerciale.entity.BonReceptionFournisseur$Statut.en_cours")
long countEnCoursByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, b.dateReception as date, " +
           "b.statut as statut) FROM BonReceptionFournisseur b " +
           "WHERE b.entreprise.id = :entrepriseId ORDER BY b.dateReception DESC")
    List<Map<String, Object>> findDernieres(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, a.nom as affaire, " +
           "b.dateReception as dateReception, b.statut as statut, b.observations as observations) " +
           "FROM BonReceptionFournisseur b LEFT JOIN b.affaire a WHERE b.entreprise.id = :entrepriseId " +
           "AND UPPER(b.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM BonReceptionFournisseurDetail d " +
           "WHERE d.bonReceptionFournisseur.entreprise.id = :entrepriseId " +
           "AND UPPER(d.bonReceptionFournisseur.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);
}
