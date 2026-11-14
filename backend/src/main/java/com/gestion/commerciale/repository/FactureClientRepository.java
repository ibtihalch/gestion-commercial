package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.FactureClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface FactureClientRepository extends JpaRepository<FactureClient, Integer>,
        JpaSpecificationExecutor<FactureClient> {

    Page<FactureClient> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee'")
    BigDecimal sumImpayeesByEntrepriseId(Integer entrepriseId);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee'")
    BigDecimal sumPayeesByEntrepriseId(Integer entrepriseId);

    @Query("""
        SELECT MONTH(f.dateFacture), SUM(f.montantHt)
        FROM FactureClient f
        WHERE f.statut = 'payee'
          AND YEAR(f.dateFacture) = :annee
          AND (:entrepriseId IS NULL OR f.entreprise.id = :entrepriseId)
        GROUP BY MONTH(f.dateFacture)
        ORDER BY MONTH(f.dateFacture)
    """)
    List<Object[]> sumPayeesByMoisAndAnnee(
        @Param("entrepriseId") Integer entrepriseId,
        @Param("annee") int annee
    );

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    @Query("SELECT new map(f.client.nom as nom, SUM(f.montantTtc) as montant) " +
           "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee' " +
           "GROUP BY f.client.nom ORDER BY SUM(f.montantTtc) DESC")
    List<Map<String, Object>> findClientsImpayes(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureClient f " +
           "WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee' " +
           "AND f.dateFacture BETWEEN :debut AND :fin")
    BigDecimal sumCaPeriode(Integer entrepriseId, LocalDate debut, LocalDate fin);

    @Query("SELECT new map(f.client.nom as nom, SUM(f.montantTtc) as montant) " +
       "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee' " +
       "GROUP BY f.client.nom ORDER BY SUM(f.montantTtc) DESC")
List<Map<String, Object>> findMeilleursClients(Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateFacture as date, " +
           "f.dateEcheance as echeance, f.statut as statut, f.montantTtc as montant) " +
           "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId ORDER BY f.dateFacture DESC")
    List<Map<String, Object>> findDernieresFactures(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee'")
    long countImpayeesByEntrepriseId(Integer entrepriseId);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateEcheance as echeance, " +
           "f.montantTtc as montant) FROM FactureClient f WHERE f.entreprise.id = :entrepriseId " +
           "AND f.statut = 'impayee' AND f.dateEcheance < :aujourdhui ORDER BY f.dateEcheance ASC")
    List<Map<String, Object>> findFacturesEnRetard(@Param("entrepriseId") Integer entrepriseId,
                                                    @Param("aujourdhui") LocalDate aujourdhui,
                                                    Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateEcheance as echeance, " +
           "f.montantTtc as montant) FROM FactureClient f WHERE f.entreprise.id = :entrepriseId " +
           "AND f.statut = 'impayee' AND f.dateEcheance BETWEEN :debut AND :fin ORDER BY f.dateEcheance ASC")
    List<Map<String, Object>> findFacturesArrivantAEcheance(@Param("entrepriseId") Integer entrepriseId,
                                                             @Param("debut") LocalDate debut,
                                                             @Param("fin") LocalDate fin, Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateFacture as dateFacture, " +
           "f.dateEcheance as dateEcheance, f.statut as statut, f.montantHt as montantHt, " +
           "f.tva as tva, f.montantTtc as montantTtc, f.observations as observations) " +
           "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND UPPER(f.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM FactureClientDetail d " +
           "WHERE d.factureClient.entreprise.id = :entrepriseId " +
           "AND UPPER(d.factureClient.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateFacture as date, " +
           "f.dateEcheance as echeance, f.statut as statut, f.montantTtc as montant) " +
           "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId " +
           "AND LOWER(f.client.nom) LIKE LOWER(CONCAT('%', :client, '%')) ORDER BY f.dateFacture DESC")
    List<Map<String, Object>> findFacturesByClient(@Param("entrepriseId") Integer entrepriseId,
                                                   @Param("client") String client,
                                                   Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.client.nom as client, f.dateFacture as date, " +
           "f.dateEcheance as echeance, f.statut as statut, f.montantTtc as montant) " +
           "FROM FactureClient f WHERE f.entreprise.id = :entrepriseId AND f.client.id IN :clientIds " +
           "ORDER BY f.dateFacture DESC")
    List<Map<String, Object>> findFacturesByClientIds(@Param("entrepriseId") Integer entrepriseId,
                                                      @Param("clientIds") List<Integer> clientIds,
                                                      Pageable pageable);

    @Query("SELECT COALESCE(SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)), 0) " +
           "FROM FactureClientDetail d WHERE d.factureClient.entreprise.id = :entrepriseId " +
           "AND d.factureClient.statut = 'payee' AND d.factureClient.dateFacture BETWEEN :debut AND :fin")
    BigDecimal sumMargePeriode(@Param("entrepriseId") Integer entrepriseId,
                               @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("SELECT new map(d.factureClient.affaire.nom as affaire, " +
           "SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) as marge) " +
           "FROM FactureClientDetail d WHERE d.factureClient.entreprise.id = :entrepriseId " +
           "AND d.factureClient.statut = 'payee' AND d.factureClient.affaire IS NOT NULL " +
           "GROUP BY d.factureClient.affaire.nom ORDER BY SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) DESC")
    List<Map<String, Object>> findAffairesParMarge(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, " +
           "SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) as marge) " +
           "FROM FactureClientDetail d WHERE d.factureClient.entreprise.id = :entrepriseId " +
           "AND d.factureClient.statut = 'payee' GROUP BY d.article.code, d.article.designation " +
           "ORDER BY SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) DESC")
    List<Map<String, Object>> findArticlesParMarge(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT new map(d.factureClient.client.nom as client, " +
           "SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) as marge) " +
           "FROM FactureClientDetail d WHERE d.factureClient.entreprise.id = :entrepriseId " +
           "AND d.factureClient.statut = 'payee' GROUP BY d.factureClient.client.nom " +
           "ORDER BY SUM(d.qte * (d.prixUnitaire - d.article.prixAchat)) DESC")
    List<Map<String, Object>> findClientsParMarge(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);
}
