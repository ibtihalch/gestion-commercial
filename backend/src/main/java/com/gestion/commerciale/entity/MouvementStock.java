package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mouvement_stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MouvementStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", nullable = false, length = 20)
    private TypeMouvement typeMouvement;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal qte;

    @Column(name = "stock_avant", nullable = false, precision = 10, scale = 3)
    private BigDecimal stockAvant;

    @Column(name = "stock_apres", nullable = false, precision = 10, scale = 3)
    private BigDecimal stockApres;

    @Column(name = "reference_document", length = 100)
    private String referenceDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_livraison_id")
    private BonLivraison bonLivraison;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_reception_fournisseur_id")
    private BonReceptionFournisseur bonReceptionFournisseur;

    @Lob
    private String observations;

    @CreationTimestamp
    @Column(name = "date_mouvement")
    private LocalDateTime dateMouvement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    public enum TypeMouvement {
        entree, sortie, ajustement
    }
}
