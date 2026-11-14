package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", uniqueConstraints =
        @UniqueConstraint(name = "uk_notification_dedupe", columnNames = "dedupe_key"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 40)
    private String categorie;

    @Column(nullable = false, length = 120)
    private String titre;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 20)
    private String niveau;

    @Column(length = 160)
    private String path;

    @Column(nullable = false)
    @Builder.Default
    private Boolean lue = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resolue = false;

    @Column(name = "date_resolution")
    private LocalDateTime dateResolution;

    @Column(name = "dedupe_key", nullable = false, length = 190)
    private String dedupeKey;

    @CreationTimestamp
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;
}
