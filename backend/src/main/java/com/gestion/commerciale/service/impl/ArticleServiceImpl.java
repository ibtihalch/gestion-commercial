package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.ArticleDTO;
import com.gestion.commerciale.entity.Article;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository     articleRepository;
    private final EntrepriseRepository  entrepriseRepository;
    private final FamilleRepository     familleRepository;
    private final SousFamilleRepository sousFamilleRepository;

    // =========================================================================
    // Lecture
    // =========================================================================

    // Remplacer findAll
@Override
@Transactional(readOnly = true)
public Page<ArticleDTO> findAll(Integer entrepriseId,
                                Integer familleId,
                                Integer sousFamilleId,
                                String search,
                                Boolean actifOnly,
                                Pageable pageable) {
    Specification<Article> spec = ArticleSpecification.build(
            entrepriseId, familleId, sousFamilleId, search, actifOnly);
    return articleRepository.findAll(spec, pageable).map(this::toDTO);
}

// Ajouter toggleActif
@Override
public ArticleDTO toggleActif(Integer id) {
    Article article = articleRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Article", id));
    article.setActif(!Boolean.TRUE.equals(article.getActif()));
    return toDTO(articleRepository.save(article));
}

    @Override
    @Transactional(readOnly = true)
    public ArticleDTO findById(Integer id) {
        return toDTO(articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArticleDTO> findAlertes() {
        return articleRepository.findArticlesSousSeuilAlerte().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // =========================================================================
    // Écriture
    // =========================================================================

    @Override
    public ArticleDTO create(ArticleDTO dto) {
        if (articleRepository.existsByCode(dto.getCode()))
            throw new BadRequestException("Un article avec ce code existe déjà : " + dto.getCode());

        Article article = new Article();
        applyDTO(dto, article);
        return toDTO(articleRepository.save(article));
    }

    @Override
    public ArticleDTO update(Integer id, ArticleDTO dto) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article", id));

        if (!article.getCode().equals(dto.getCode()) && articleRepository.existsByCode(dto.getCode()))
            throw new BadRequestException("Ce code est déjà utilisé");

        applyDTO(dto, article);
        return toDTO(articleRepository.save(article));
    }

    @Override
    public void delete(Integer id) {
        articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article", id));
        articleRepository.deleteById(id);
    }

    // =========================================================================
    // Compteur
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public long count(Integer entrepriseId) {
        return entrepriseId != null
                ? articleRepository.countByEntrepriseId(entrepriseId)
                : articleRepository.count();
    }

    // =========================================================================
    // Helpers privés
    // =========================================================================

    private void applyDTO(ArticleDTO dto, Article article) {
        article.setCode(dto.getCode());
        article.setDesignation(dto.getDesignation());
        article.setUnite(dto.getUnite());
        article.setPrixAchat(dto.getPrixAchat());
        article.setPrixVente(dto.getPrixVente());
        article.setStock(dto.getStock());
        article.setSeuilAlerte(dto.getSeuilAlerte());
        article.setActif(dto.getActif() != null ? dto.getActif() : true);

        if (dto.getEntrepriseId() != null) {
            article.setEntreprise(entrepriseRepository.findById(dto.getEntrepriseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", dto.getEntrepriseId())));
        }

        // ── Famille ──────────────────────────────────────────────────────────
        if (dto.getFamilleId() != null) {
            article.setFamille(familleRepository.findById(dto.getFamilleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Famille", dto.getFamilleId())));
        } else {
            article.setFamille(null);
        }

        // ── Sous-famille ──────────────────────────────────────────────────────
        if (dto.getSousFamilleId() != null) {
            var sf = sousFamilleRepository.findById(dto.getSousFamilleId())
                    .orElseThrow(() -> new ResourceNotFoundException("SousFamille", dto.getSousFamilleId()));

            // Cohérence : la sous-famille doit appartenir à la famille sélectionnée
            if (dto.getFamilleId() != null && !sf.getFamille().getId().equals(dto.getFamilleId()))
                throw new BadRequestException(
                        "La sous-famille sélectionnée n'appartient pas à la famille indiquée.");

            article.setSousFamille(sf);
        } else {
            article.setSousFamille(null);
        }
    }

    private ArticleDTO toDTO(Article a) {
        return ArticleDTO.builder()
                .id(a.getId())
                .code(a.getCode())
                .designation(a.getDesignation())
                .unite(a.getUnite())
                .prixAchat(a.getPrixAchat())
                .prixVente(a.getPrixVente())
                .stock(a.getStock())
                .seuilAlerte(a.getSeuilAlerte())
                .actif(a.getActif())
                .entrepriseId(a.getEntreprise() != null ? a.getEntreprise().getId() : null)
                // Famille
                .familleId(a.getFamille() != null ? a.getFamille().getId() : null)
                .familleLibelle(a.getFamille() != null ? a.getFamille().getLibelle() : null)
                // Sous-famille
                .sousFamilleId(a.getSousFamille() != null ? a.getSousFamille().getId() : null)
                .sousFamilleLibelle(a.getSousFamille() != null ? a.getSousFamille().getLibelle() : null)
                .dateCreation(a.getDateCreation())
                .build();
    }
}