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
@Table(name = "bon_livraison")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BonLivraison {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_client_id")
    private BonCommandeClient bonCommandeClient;

    @Column(name = "date_livraison", nullable = false)
    private LocalDate dateLivraison;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Statut statut = Statut.en_cours;

    @Lob
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(name = "montant_ht", precision = 10, scale = 2)
    private BigDecimal montantHt = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal tva = BigDecimal.ZERO;

    @Column(name = "montant_ttc", precision = 10, scale = 2)
    private BigDecimal montantTtc = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @OneToMany(mappedBy = "bonLivraison", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BonLivraisonDetail> details;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public enum Statut {
        en_cours, livre, facture,annule 
    }
}
