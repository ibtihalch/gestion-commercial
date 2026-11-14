package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "fournisseurs", uniqueConstraints = {
    @UniqueConstraint(columnNames = "nom",   name = "uk_fournisseur_nom"),
    @UniqueConstraint(columnNames = "email", name = "uk_fournisseur_email"),
    @UniqueConstraint(columnNames = "ice",   name = "uk_fournisseur_ice")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 200)
    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "tinyint(1) default 1")
    private Boolean actif = true;

    @Column(length = 20)
    private String ice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @OneToMany(mappedBy = "fournisseur")
    private List<BonCommandeFournisseur> bonsCommandeFournisseur;

    @OneToMany(mappedBy = "fournisseur")
    private List<BonReceptionFournisseur> bonsReception;

    @OneToMany(mappedBy = "fournisseur")
    private List<FactureFournisseur> facturesFournisseur;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}
