package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonCommandeFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;
import java.util.Map;

public interface BonCommandeFournisseurRepository extends JpaRepository<BonCommandeFournisseur, Integer>,
        JpaSpecificationExecutor<BonCommandeFournisseur> {

    Page<BonCommandeFournisseur> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT bc FROM BonCommandeFournisseur bc " +
           "JOIN FETCH bc.fournisseur " +
           "LEFT JOIN FETCH bc.affaire " +
           "LEFT JOIN FETCH bc.details d " +
           "LEFT JOIN FETCH d.article " +
           "WHERE bc.id = :id")
    Optional<BonCommandeFournisseur> findByIdWithDetails(@Param("id") Integer id);

    @Query("SELECT COUNT(b) FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId " +
       "AND b.statut = com.gestion.commerciale.entity.BonCommandeFournisseur$Statut.en_cours")
long countEnCoursByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

@Query("SELECT COALESCE(SUM(b.montantTtc), 0) FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId")
BigDecimal sumMontantTtcByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, b.dateCommande as date, " +
           "b.dateLivraisonPrevue as livraisonPrevue, b.statut as statut, b.montantTtc as montant) " +
           "FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId ORDER BY b.dateCommande DESC")
    List<Map<String, Object>> findDernieres(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, " +
           "b.dateLivraisonPrevue as livraisonPrevue, b.montantTtc as montant) " +
           "FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId " +
           "AND b.statut = com.gestion.commerciale.entity.BonCommandeFournisseur$Statut.en_cours " +
           "AND b.dateLivraisonPrevue < :aujourdhui ORDER BY b.dateLivraisonPrevue ASC")
    List<Map<String, Object>> findCommandesEnRetard(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("aujourdhui") java.time.LocalDate aujourdhui,
                                                     Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, " +
           "b.dateLivraisonPrevue as livraisonPrevue, b.montantTtc as montant) " +
           "FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId " +
           "AND b.statut = com.gestion.commerciale.entity.BonCommandeFournisseur$Statut.en_cours " +
           "AND b.dateLivraisonPrevue BETWEEN :debut AND :fin ORDER BY b.dateLivraisonPrevue ASC")
    List<Map<String, Object>> findCommandesArrivantAEcheance(@Param("entrepriseId") Integer entrepriseId,
                                                              @Param("debut") java.time.LocalDate debut,
                                                              @Param("fin") java.time.LocalDate fin, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.fournisseur.nom as fournisseur, b.dateCommande as dateCommande, " +
           "b.dateLivraisonPrevue as dateLivraisonPrevue, b.statut as statut, b.montantHt as montantHt, " +
           "b.tva as tva, b.montantTtc as montantTtc, b.observations as observations) " +
           "FROM BonCommandeFournisseur b WHERE b.entreprise.id = :entrepriseId " +
           "AND UPPER(b.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM BonCommandeFournisseurDetail d " +
           "WHERE d.bonCommandeFournisseur.entreprise.id = :entrepriseId " +
           "AND UPPER(d.bonCommandeFournisseur.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);
}
