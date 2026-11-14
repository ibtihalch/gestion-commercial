package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "devis")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Devis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affaire_id")
    private Affaire affaire;

    @Column(name = "date_devis", nullable = false)
    private LocalDate dateDevis;

    @Column(name = "date_validite")
    private LocalDate dateValidite;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StatutDevis statut = StatutDevis.brouillon;

    @Column(name = "montant_ht", precision = 20, scale = 3)
    private BigDecimal montantHt;

    @Column(precision = 20, scale = 3)
    private BigDecimal tva;

    @Column(name = "montant_ttc", precision = 20, scale = 3)
    private BigDecimal montantTtc;

    @Lob
    private String observations;

    @Lob
    @Column(name = "conditions_paiement")
    private String conditionsPaiement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DevisDetail> details;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public enum StatutDevis {
        brouillon, envoye, accepte, refuse, expire
    }
}