package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.BonCommandeClientDTO;
import com.gestion.commerciale.entity.BonCommandeClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface BonCommandeClientService {

    Page<BonCommandeClientDTO> findAll(Integer entrepriseId, Pageable pageable);

    Page<BonCommandeClientDTO> findAll(Integer entrepriseId,
                                       String search,
                                       BonCommandeClient.Statut statut,
                                       Integer clientId,
                                       LocalDate dateDebut,
                                       LocalDate dateFin,
                                       Pageable pageable);

    BonCommandeClientDTO findById(Integer id);
    BonCommandeClientDTO create(BonCommandeClientDTO dto, String loginUtilisateur);
    BonCommandeClientDTO update(Integer id, BonCommandeClientDTO dto, String loginUtilisateur);
    BonCommandeClientDTO updateStatut(Integer id, BonCommandeClient.Statut statut);
    void delete(Integer id);
}