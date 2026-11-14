package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Devis;
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

public interface DevisRepository extends JpaRepository<Devis, Integer>,
        JpaSpecificationExecutor<Devis> {

    Page<Devis> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId")
    long countByEntrepriseId(Integer entrepriseId);

    @Query("SELECT COALESCE(SUM(d.montantTtc), 0) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut = 'accepte'")
    BigDecimal sumMontantTtcAccepteByEntrepriseId(Integer entrepriseId);

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    @Query("SELECT new map(d.numero as numero, d.client.nom as client, d.montantTtc as montant, d.dateValidite as dateValidite) " +
           "FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut = com.gestion.commerciale.entity.Devis$StatutDevis.envoye " +
           "ORDER BY d.dateValidite ASC")
    List<Map<String, Object>> findDevisEnAttente(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(d.numero as numero, d.client.nom as client, d.montantTtc as montant, d.dateValidite as dateValidite) " +
           "FROM Devis d WHERE d.entreprise.id = :entrepriseId " +
           "AND d.statut = com.gestion.commerciale.entity.Devis$StatutDevis.envoye " +
           "AND d.dateValidite < CURRENT_DATE " +
           "ORDER BY d.dateValidite ASC")
    List<Map<String, Object>> findDevisExpires(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(d.numero as numero, d.client.nom as client, d.montantTtc as montant, " +
           "d.dateValidite as dateValidite) FROM Devis d WHERE d.entreprise.id = :entrepriseId " +
           "AND d.statut = com.gestion.commerciale.entity.Devis$StatutDevis.envoye " +
           "AND d.dateValidite BETWEEN :aujourdhui AND :dateLimite ORDER BY d.dateValidite ASC")
    List<Map<String, Object>> findDevisExpirantBientot(@Param("entrepriseId") Integer entrepriseId,
                                                       @Param("aujourdhui") java.time.LocalDate aujourdhui,
                                                       @Param("dateLimite") java.time.LocalDate dateLimite,
                                                       Pageable pageable);

    @Query("SELECT new map(d.numero as numero, d.client.nom as client, a.nom as affaire, " +
           "d.dateDevis as dateDevis, d.dateValidite as dateValidite, d.statut as statut, " +
           "d.montantHt as montantHt, d.tva as tva, d.montantTtc as montantTtc, " +
           "d.observations as observations, d.conditionsPaiement as conditionsPaiement) " +
           "FROM Devis d LEFT JOIN d.affaire a WHERE d.entreprise.id = :entrepriseId AND UPPER(d.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(dd.article.code as code, dd.article.designation as article, dd.qte as quantite, " +
           "dd.prixUnitaire as prixUnitaire, dd.montant as montant) FROM DevisDetail dd " +
           "WHERE dd.devis.entreprise.id = :entrepriseId AND UPPER(dd.devis.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut = 'accepte' " +
           "AND d.dateDevis BETWEEN :debut AND :fin")
    long countAcceptesPeriode(@Param("entrepriseId") Integer entrepriseId,
                              @Param("debut") java.time.LocalDate debut,
                              @Param("fin") java.time.LocalDate fin);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut <> 'brouillon' " +
           "AND d.dateDevis BETWEEN :debut AND :fin")
    long countSoumisPeriode(@Param("entrepriseId") Integer entrepriseId,
                            @Param("debut") java.time.LocalDate debut,
                            @Param("fin") java.time.LocalDate fin);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut = 'refuse'")
    long countRefuses(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut = 'accepte'")
    long countAcceptes(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT COUNT(d) FROM Devis d WHERE d.entreprise.id = :entrepriseId AND d.statut <> 'brouillon'")
    long countSoumis(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(d.client.nom as client, COUNT(d) as nombreAcceptes, " +
           "SUM(d.montantTtc) as montantAccepte) FROM Devis d WHERE d.entreprise.id = :entrepriseId " +
           "AND d.statut = 'accepte' GROUP BY d.client.nom ORDER BY COUNT(d) DESC, SUM(d.montantTtc) DESC")
    List<Map<String, Object>> findClientsAvecPlusDeDevisAcceptes(@Param("entrepriseId") Integer entrepriseId,
                                                                  Pageable pageable);
}
