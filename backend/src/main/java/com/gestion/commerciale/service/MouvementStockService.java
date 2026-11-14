package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.MouvementStockDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MouvementStockService {
    Page<MouvementStockDTO> findAll(Integer articleId, Integer entrepriseId, Pageable pageable);
    MouvementStockDTO create(MouvementStockDTO dto);
}
