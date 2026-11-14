package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.BonReceptionFournisseurDTO;
import com.gestion.commerciale.entity.BonReceptionFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface BonReceptionFournisseurService {
    // Ancienne signature — délègue à la nouvelle
    Page<BonReceptionFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable);

    // Nouvelle signature avec filtres
    Page<BonReceptionFournisseurDTO> findAll(Integer entrepriseId,
                                              String search,
                                              BonReceptionFournisseur.Statut statut,
                                              Integer fournisseurId,
                                              LocalDate dateDebut,
                                              LocalDate dateFin,
                                              Pageable pageable);

    BonReceptionFournisseurDTO findById(Integer id);
    BonReceptionFournisseurDTO create(BonReceptionFournisseurDTO dto, String loginUtilisateur);
    BonReceptionFournisseurDTO update(Integer id, BonReceptionFournisseurDTO dto, String loginUtilisateur);
    BonReceptionFournisseurDTO updateStatut(Integer id, BonReceptionFournisseur.Statut statut);
    void delete(Integer id);
}