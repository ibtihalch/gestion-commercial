package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.FactureFournisseur;
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

public interface FactureFournisseurRepository extends JpaRepository<FactureFournisseur, Integer>,
        JpaSpecificationExecutor<FactureFournisseur> {

    Page<FactureFournisseur> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee'")
    BigDecimal sumImpayeesByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee'")
    BigDecimal sumPayeesByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    /** Fournisseurs auxquels l'entreprise doit encore de l'argent (factures reçues non payées) */
    @Query("SELECT new map(f.fournisseur.nom as nom, SUM(f.montantTtc) as montant) " +
           "FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee' " +
           "GROUP BY f.fournisseur.nom ORDER BY SUM(f.montantTtc) DESC")
    List<Map<String, Object>> findFournisseursAPayer(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    /** Classement des fournisseurs par montant total facturé et payé (le plus "important" = le plus gros volume d'achat) */
    @Query("SELECT new map(f.fournisseur.nom as nom, SUM(f.montantTtc) as montant) " +
           "FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee' " +
           "GROUP BY f.fournisseur.nom ORDER BY SUM(f.montantTtc) DESC")
    List<Map<String, Object>> findMeilleursFournisseurs(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM FactureFournisseur f " +
           "WHERE f.entreprise.id = :entrepriseId AND f.statut = 'payee' " +
           "AND f.dateFacture BETWEEN :debut AND :fin")
    BigDecimal sumAchatsPeriode(@Param("entrepriseId") Integer entrepriseId,
                                @Param("debut") LocalDate debut,
                                @Param("fin") LocalDate fin);

    @Query("SELECT new map(f.numero as numero, f.fournisseur.nom as fournisseur, f.dateFacture as date, " +
           "f.dateEcheance as echeance, f.statut as statut, f.montantTtc as montant) " +
           "FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId ORDER BY f.dateFacture DESC")
    List<Map<String, Object>> findDernieresFactures(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId AND f.statut = 'impayee'")
    long countImpayeesByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);

    @Query("SELECT new map(f.numero as numero, f.fournisseur.nom as fournisseur, f.dateEcheance as echeance, " +
           "f.montantTtc as montant) FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId " +
           "AND f.statut = 'impayee' AND f.dateEcheance < :aujourdhui ORDER BY f.dateEcheance ASC")
    List<Map<String, Object>> findFacturesEnRetard(@Param("entrepriseId") Integer entrepriseId,
                                                    @Param("aujourdhui") LocalDate aujourdhui,
                                                    Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.fournisseur.nom as fournisseur, f.dateEcheance as echeance, " +
           "f.montantTtc as montant) FROM FactureFournisseur f WHERE f.entreprise.id = :entrepriseId " +
           "AND f.statut = 'impayee' AND f.dateEcheance BETWEEN :debut AND :fin ORDER BY f.dateEcheance ASC")
    List<Map<String, Object>> findFacturesArrivantAEcheance(@Param("entrepriseId") Integer entrepriseId,
                                                             @Param("debut") LocalDate debut,
                                                             @Param("fin") LocalDate fin, Pageable pageable);

    @Query("SELECT new map(f.numero as numero, f.fournisseur.nom as fournisseur, a.nom as affaire, " +
           "f.dateFacture as dateFacture, f.dateEcheance as dateEcheance, f.statut as statut, " +
           "f.montantHt as montantHt, f.tva as tva, f.montantTtc as montantTtc, f.observations as observations) " +
           "FROM FactureFournisseur f LEFT JOIN f.affaire a WHERE f.entreprise.id = :entrepriseId AND UPPER(f.numero) = UPPER(:numero)")
    Optional<Map<String, Object>> findDetailByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                     @Param("numero") String numero);

    @Query("SELECT new map(d.article.code as code, d.article.designation as article, d.qte as quantite, " +
           "d.prixUnitaire as prixUnitaire, d.montant as montant) FROM FactureFournisseurDetail d " +
           "WHERE d.factureFournisseur.entreprise.id = :entrepriseId " +
           "AND UPPER(d.factureFournisseur.numero) = UPPER(:numero)")
    List<Map<String, Object>> findLignesByNumero(@Param("entrepriseId") Integer entrepriseId,
                                                 @Param("numero") String numero);
}
