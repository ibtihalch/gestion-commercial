package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.FactureFournisseurDTO;
import com.gestion.commerciale.entity.FactureFournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface FactureFournisseurService {
    // Ancienne signature — délègue à la nouvelle
    Page<FactureFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable);

    // Nouvelle signature avec filtres
    Page<FactureFournisseurDTO> findAll(Integer entrepriseId,
                                        String search,
                                        FactureFournisseur.Statut statut,
                                        Integer fournisseurId,
                                        LocalDate dateDebut,
                                        LocalDate dateFin,
                                        Pageable pageable);

    FactureFournisseurDTO findById(Integer id);
    FactureFournisseurDTO create(FactureFournisseurDTO dto, String loginUtilisateur);
    FactureFournisseurDTO update(Integer id, FactureFournisseurDTO dto, String loginUtilisateur);
    FactureFournisseurDTO updateStatut(Integer id, FactureFournisseur.Statut statut);
    void delete(Integer id);
}