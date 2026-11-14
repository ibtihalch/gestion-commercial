package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.FournisseurDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FournisseurService {
    Page<FournisseurDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable); // ← modifié
    FournisseurDTO findById(Integer id);
    FournisseurDTO create(FournisseurDTO dto);
    FournisseurDTO update(Integer id, FournisseurDTO dto);
    void delete(Integer id);
    long count(Integer entrepriseId);
    FournisseurDTO toggleActif(Integer id); // ← nouveau
}