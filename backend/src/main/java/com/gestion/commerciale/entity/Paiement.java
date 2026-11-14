package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiement")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // ── Lien facture client (nullable si fournisseur) ─────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_client_id")
    private FactureClient factureClient;

    // ── Lien facture fournisseur (nullable si client) ─────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_fournisseur_id")
    private FactureFournisseur factureFournisseur;

    // ── Informations du paiement ──────────────────────────────────────────────
    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", nullable = false, length = 30)
    private ModePaiement modePaiement;

    @Column(name = "montant", nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "reference", length = 100)
    private String reference;

    @Lob
    @Column(name = "remarque")
    private String remarque;

    // ── Traçabilité : utilisateur qui a validé ────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validé_par_id")
    private Utilisateur validePar;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    // ── Enum modes de paiement ────────────────────────────────────────────────
    public enum ModePaiement {
        especes,
        cheque,
        virement,
        carte_bancaire
    }
}