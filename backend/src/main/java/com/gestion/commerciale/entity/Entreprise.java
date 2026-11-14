package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "entreprises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Entreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 100)
    private String responsable;

    @Lob
    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(length = 20)
    private String fax;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String ice;

    @Column(length = 50)
    private String ifiscale;

    @Column(length = 50)
    private String cnss;

    @Column(length = 50)
    private String patente;

    @Column(length = 50)
    private String rc;

    @Column(name = "compte_bancaire", length = 100)
    private String compteBancaire;

    @Column(name = "site_web", length = 100)
    private String siteWeb;

    @Column(length = 255)
    private String logo;

    @Lob
    private String description;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
    private List<Utilisateur> utilisateurs;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
    private List<Client> clients;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
    private List<Fournisseur> fournisseurs;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
    private List<Article> articles;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL)
    private List<Affaire> affaires;
}
