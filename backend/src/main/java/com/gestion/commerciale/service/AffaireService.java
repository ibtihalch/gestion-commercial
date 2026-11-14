package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.AffaireDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AffaireService {
    Page<AffaireDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable); // ← modifié
    AffaireDTO findById(Integer id);
    AffaireDTO create(AffaireDTO dto);
    AffaireDTO update(Integer id, AffaireDTO dto);
    void delete(Integer id);
    AffaireDTO toggleActif(Integer id); // ← nouveau
}