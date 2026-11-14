package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.BonCommandeFournisseurDTO;
import com.gestion.commerciale.entity.BonCommandeFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface BonCommandeFournisseurService {
    // Ancienne signature — délègue à la nouvelle
    Page<BonCommandeFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable);

    // Nouvelle signature avec filtres
    Page<BonCommandeFournisseurDTO> findAll(Integer entrepriseId,
                                             String search,
                                             BonCommandeFournisseur.Statut statut,
                                             Integer fournisseurId,
                                             LocalDate dateDebut,
                                             LocalDate dateFin,
                                             Pageable pageable);

    BonCommandeFournisseurDTO findById(Integer id);
    BonCommandeFournisseurDTO create(BonCommandeFournisseurDTO dto, String loginUtilisateur);
    BonCommandeFournisseurDTO update(Integer id, BonCommandeFournisseurDTO dto, String loginUtilisateur);
    BonCommandeFournisseurDTO updateStatut(Integer id, BonCommandeFournisseur.Statut statut);
    void delete(Integer id);
}