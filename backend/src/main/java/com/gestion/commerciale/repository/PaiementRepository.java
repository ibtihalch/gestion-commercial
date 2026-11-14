package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Paiement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface PaiementRepository extends JpaRepository<Paiement, Integer> {

    // ── Historique paiements d'une facture client ──────────────────────────────
    List<Paiement> findByFactureClientIdOrderByDatePaiementDesc(Integer factureClientId);

    // ── Historique paiements d'une facture fournisseur ────────────────────────
    List<Paiement> findByFactureFournisseurIdOrderByDatePaiementDesc(Integer factureFournisseurId);

    // ── Somme des paiements d'une facture client ───────────────────────────────
    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.factureClient.id = :factureClientId")
    BigDecimal sumMontantByFactureClientId(@Param("factureClientId") Integer factureClientId);

    // ── Somme des paiements d'une facture fournisseur ─────────────────────────
    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.factureFournisseur.id = :factureFournisseurId")
    BigDecimal sumMontantByFactureFournisseurId(@Param("factureFournisseurId") Integer factureFournisseurId);

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    /** Total des encaissements (paiements reçus des clients) sur une période */
    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.factureClient.entreprise.id = :entrepriseId " +
           "AND p.factureClient IS NOT NULL " +
           "AND p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumEncaissementsPeriode(@Param("entrepriseId") Integer entrepriseId,
                                       @Param("debut") LocalDate debut,
                                       @Param("fin") LocalDate fin);

    /** Total des décaissements (paiements versés aux fournisseurs) sur une période */
    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.factureFournisseur.entreprise.id = :entrepriseId " +
           "AND p.factureFournisseur IS NOT NULL " +
           "AND p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumDecaissementsPeriode(@Param("entrepriseId") Integer entrepriseId,
                                       @Param("debut") LocalDate debut,
                                       @Param("fin") LocalDate fin);

    /** Derniers paiements reçus des clients, les plus récents en premier */
    @Query("SELECT new map(p.datePaiement as date, p.montant as montant, " +
           "p.modePaiement as mode, f.numero as facture, f.client.nom as client) " +
           "FROM Paiement p JOIN p.factureClient f " +
           "WHERE f.entreprise.id = :entrepriseId " +
           "ORDER BY p.datePaiement DESC")
    List<Map<String, Object>> findDerniersPaiementsClients(@Param("entrepriseId") Integer entrepriseId, Pageable pageable);
}