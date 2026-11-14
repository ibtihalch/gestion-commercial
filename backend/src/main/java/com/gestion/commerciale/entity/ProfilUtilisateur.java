package com.gestion.commerciale.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profil_utilisateur")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfilUtilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "utilisateur_id", unique = true)
    private Utilisateur utilisateur;

    @Column(length = 255)
    private String img;

    @Column(length = 355)
    private String signature;

    @Lob
    private String bio;

    @Column(length = 200)
    private String poste;
}
