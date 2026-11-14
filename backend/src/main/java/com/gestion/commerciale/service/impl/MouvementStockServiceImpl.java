package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.MouvementStockDTO;
import com.gestion.commerciale.entity.Article;
import com.gestion.commerciale.entity.MouvementStock;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.ArticleRepository;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.repository.MouvementStockRepository;
import com.gestion.commerciale.service.MouvementStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MouvementStockServiceImpl implements MouvementStockService {

    private final MouvementStockRepository mouvementStockRepository;
    private final ArticleRepository articleRepository;
    private final EntrepriseRepository entrepriseRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<MouvementStockDTO> findAll(Integer articleId, Integer entrepriseId, Pageable pageable) {
        Page<MouvementStock> page;
        if (articleId != null) page = mouvementStockRepository.findByArticleId(articleId, pageable);
        else if (entrepriseId != null) page = mouvementStockRepository.findByEntrepriseId(entrepriseId, pageable);
        else page = mouvementStockRepository.findAll(pageable);
        return page.map(this::toDTO);
    }

    @Override
    public MouvementStockDTO create(MouvementStockDTO dto) {
        Article article = articleRepository.findById(dto.getArticleId())
                .orElseThrow(() -> new ResourceNotFoundException("Article", dto.getArticleId()));

        if (dto.getTypeMouvement() == MouvementStock.TypeMouvement.sortie
                && article.getStock().compareTo(dto.getQte()) < 0)
            throw new BadRequestException("Stock insuffisant. Stock actuel : " + article.getStock());

        MouvementStock mvt = new MouvementStock();
        mvt.setArticle(article);
        mvt.setTypeMouvement(dto.getTypeMouvement());
        mvt.setQte(dto.getQte());
        mvt.setStockAvant(article.getStock());
        mvt.setReferenceDocument(dto.getReferenceDocument());
        mvt.setObservations(dto.getObservations());

        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(mvt::setEntreprise);

        switch (dto.getTypeMouvement()) {
            case entree -> article.setStock(article.getStock().add(dto.getQte()));
            case sortie -> article.setStock(article.getStock().subtract(dto.getQte()));
            case ajustement -> article.setStock(dto.getQte());
        }

        mvt.setStockApres(article.getStock());
        articleRepository.save(article);
        return toDTO(mouvementStockRepository.save(mvt));
    }

    private MouvementStockDTO toDTO(MouvementStock m) {
        return MouvementStockDTO.builder()
                .id(m.getId())
                .articleId(m.getArticle().getId())
                .articleCode(m.getArticle().getCode())
                .articleDesignation(m.getArticle().getDesignation())
                .typeMouvement(m.getTypeMouvement())
                .qte(m.getQte())
                .stockAvant(m.getStockAvant())
                .stockApres(m.getStockApres())
                .referenceDocument(m.getReferenceDocument())
                .observations(m.getObservations())
                .entrepriseId(m.getEntreprise() != null ? m.getEntreprise().getId() : null)
                .dateMouvement(m.getDateMouvement())
                .build();
    }
}
