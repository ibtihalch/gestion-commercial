package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bon_reception_fournisseur")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BonReceptionFournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affaire_id")
    private Affaire affaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_fournisseur_id")
    private BonCommandeFournisseur bonCommandeFournisseur;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Statut statut = Statut.en_cours;

    @Lob
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @OneToMany(mappedBy = "bonReceptionFournisseur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BonReceptionFournisseurDetail> details;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public enum Statut {
        en_cours, recu, facture ,annule
    }
}
