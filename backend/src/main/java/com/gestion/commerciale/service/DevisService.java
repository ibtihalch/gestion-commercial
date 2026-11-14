package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.DevisDTO;
import com.gestion.commerciale.entity.Devis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface DevisService {

    Page<DevisDTO> findAll(Integer entrepriseId, Pageable pageable);

    Page<DevisDTO> findAll(Integer entrepriseId,
                           String search,
                           Devis.StatutDevis statut,
                           Integer clientId,
                           LocalDate dateDebut,
                           LocalDate dateFin,
                           Pageable pageable);

    DevisDTO findById(Integer id);
    DevisDTO create(DevisDTO dto, String loginUtilisateur);
    DevisDTO update(Integer id, DevisDTO dto, String loginUtilisateur);
    DevisDTO updateStatut(Integer id, Devis.StatutDevis statut);
    void     delete(Integer id);
    long     count(Integer entrepriseId);

    // ✅ NOUVEAU — appelé automatiquement lors de la création d'un BCC
    void accepter(Integer devisId);
}