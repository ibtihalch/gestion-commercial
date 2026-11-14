package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.BonLivraisonDTO;
import com.gestion.commerciale.entity.BonLivraison;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface BonLivraisonService {

    Page<BonLivraisonDTO> findAll(Integer entrepriseId, Pageable pageable);

    Page<BonLivraisonDTO> findAll(Integer entrepriseId,
                                   String search,
                                   BonLivraison.Statut statut,
                                   Integer clientId,
                                   LocalDate dateDebut,
                                   LocalDate dateFin,
                                   Pageable pageable);

    BonLivraisonDTO findById(Integer id);
    BonLivraisonDTO create(BonLivraisonDTO dto, String loginUtilisateur);
    BonLivraisonDTO update(Integer id, BonLivraisonDTO dto, String loginUtilisateur);
    BonLivraisonDTO updateStatut(Integer id, BonLivraison.Statut statut);
    void delete(Integer id);
}