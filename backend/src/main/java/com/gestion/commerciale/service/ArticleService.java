package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.ArticleDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ArticleService {
    Page<ArticleDTO> findAll(Integer entrepriseId,
                             Integer familleId,
                             Integer sousFamilleId,
                             String search,
                             Boolean actifOnly,       // ← nouveau
                             Pageable pageable);

    ArticleDTO findById(Integer id);
    List<ArticleDTO> findAlertes();
    ArticleDTO create(ArticleDTO dto);
    ArticleDTO update(Integer id, ArticleDTO dto);
    void delete(Integer id);
    long count(Integer entrepriseId);
    ArticleDTO toggleActif(Integer id);               // ← nouveau
}