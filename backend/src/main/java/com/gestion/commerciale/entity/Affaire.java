package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "affaires")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Affaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 255)
    private String description;

    @Column(columnDefinition = "tinyint(1) default 1")
    private Boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @OneToMany(mappedBy = "affaire")
    private List<Devis> devis;

    @OneToMany(mappedBy = "affaire")
    private List<BonCommandeClient> bonsCommandeClient;

    @OneToMany(mappedBy = "affaire")
    private List<BonCommandeFournisseur> bonsCommandeFournisseur;

    @OneToMany(mappedBy = "affaire")
    private List<BonLivraison> bonsLivraison;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}
