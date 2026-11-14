package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.FactureClientDTO;
import com.gestion.commerciale.entity.FactureClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface FactureClientService {

    // ── Ancienne signature conservée pour rétrocompatibilité ─────────────────
    Page<FactureClientDTO> findAll(Integer entrepriseId, Pageable pageable);

    // ── Nouvelle signature avec filtres ──────────────────────────────────────
    Page<FactureClientDTO> findAll(Integer entrepriseId,
                                   String search,
                                   FactureClient.Statut statut,
                                   Integer clientId,
                                   LocalDate dateDebut,
                                   LocalDate dateFin,
                                   Pageable pageable);

    FactureClientDTO findById(Integer id);
    FactureClientDTO create(FactureClientDTO dto, String loginUtilisateur);
    FactureClientDTO update(Integer id, FactureClientDTO dto, String loginUtilisateur);
    FactureClientDTO updateStatut(Integer id, FactureClient.Statut statut);
    void delete(Integer id);
    BigDecimal sumImpayees(Integer entrepriseId);
    BigDecimal sumPayees(Integer entrepriseId);
}