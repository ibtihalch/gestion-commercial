package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.FamilleDTO;
import com.gestion.commerciale.dto.SousFamilleDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FamilleService {

    // ── Famille ───────────────────────────────────────────────────────────────
    Page<FamilleDTO> findAllFamilles(Integer entrepriseId, Pageable pageable);
    FamilleDTO findFamilleById(Integer id);
    FamilleDTO createFamille(FamilleDTO dto);
    FamilleDTO updateFamille(Integer id, FamilleDTO dto);
    void deleteFamille(Integer id);

    // ── Sous-famille ──────────────────────────────────────────────────────────
    Page<SousFamilleDTO> findAllSousFamilles(Integer familleId, Pageable pageable);
    List<SousFamilleDTO> findSousFamillesByFamille(Integer familleId);
    SousFamilleDTO findSousFamilleById(Integer id);
    SousFamilleDTO createSousFamille(SousFamilleDTO dto);
    SousFamilleDTO updateSousFamille(Integer id, SousFamilleDTO dto);
    void deleteSousFamille(Integer id);
}