package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles", indexes = {
        @Index(name = "idx_articles_code", columnList = "code"),
        @Index(name = "idx_articles_famille", columnList = "famille_id"),
        @Index(name = "idx_articles_sous_famille", columnList = "sous_famille_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Lob
    private String designation;

    @Column(length = 50)
    private String unite;

    @Column(name = "prix_achat", precision = 10, scale = 2)
    private BigDecimal prixAchat = BigDecimal.ZERO;

    @Column(name = "prix_vente", precision = 10, scale = 2)
    private BigDecimal prixVente = BigDecimal.ZERO;

    @Column(precision = 10, scale = 3)
    private BigDecimal stock = BigDecimal.ZERO;

    @Column(name = "seuil_alerte")
    private Integer seuilAlerte = 0;

    @Column(columnDefinition = "tinyint(1) default 1")
    private Boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    // ── Nouvelle relation Famille ──────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "famille_id")
    private Famille famille;

    // ── Nouvelle relation SousFamille ──────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_famille_id")
    private SousFamille sousFamille;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}