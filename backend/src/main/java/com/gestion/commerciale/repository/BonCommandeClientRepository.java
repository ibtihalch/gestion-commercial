package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.BonCommandeClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BonCommandeClientRepository extends JpaRepository<BonCommandeClient, Integer>,
        JpaSpecificationExecutor<BonCommandeClient> {

    Page<BonCommandeClient> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.montantTtc), 0) FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId")
    BigDecimal sumMontantTtcByEntrepriseId(Integer entrepriseId);

    @Query("SELECT COUNT(b) FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId " +
       "AND b.statut = com.gestion.commerciale.entity.BonCommandeClient$Statut.en_cours")
long countEnCoursByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, b.dateCommande as date, " +
           "b.dateLivraisonPrevue as livraisonPrevue, b.statut as statut, b.montantTtc as montant) " +
           "FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId ORDER BY b.dateCommande DESC")
    List<Map<String, Object>> findDernieres(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, b.dateLivraisonPrevue as livraisonPrevue, " +
           "b.montantTtc as montant) FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId " +
           "AND b.statut = com.gestion.commerciale.entity.BonCommandeClient$Statut.en_cours " +
           "AND b.dateLivraisonPrevue < :aujourdhui ORDER BY b.dateLivraisonPrevue ASC")
    List<Map<String, Object>> findCommandesEnRetard(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("aujourdhui") java.time.LocalDate aujourdhui,
                                                     Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, b.dateLivraisonPrevue as livraisonPrevue, " +
           "b.montantTtc as montant) FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId " +
           "AND b.statut = com.gestion.commerciale.entity.BonCommandeClient$Statut.en_cours " +
           "AND b.dateLivraisonPrevue BETWEEN :debut AND :fin ORDER BY b.dateLivraisonPrevue ASC")
    List<Map<String, Object>> findCommandesArrivantAEcheance(@Param("entrepriseId") Integer entrepriseId,
                                                              @Param("debut") java.time.LocalDate debut,
                                                              @Param("fin") java.time.LocalDate fin, Pageable pageable);

    @Query("SELECT new map(b.numero as numero, b.client.nom as client, b.dateCommande as dateCommande, " +
           "b.dateLivraisonPrevue as dateLivraisonPrevue, b.statut as statut, b.montantHt as montantHt, " +
           "b.tva as tva, b.montantTtc as montantTtc, b.observations as observations) " +
           "FROM BonCommandeClient b WHERE b.entreprise.id = :entrepriseId AND UPPER(b.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM BonCommandeClientDetail d " +
           "WHERE d.bonCommandeClient.entreprise.id = :entrepriseId " +
           "AND UPPER(d.bonCommandeClient.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);
}
