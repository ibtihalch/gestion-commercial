package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.AffaireDTO;
import com.gestion.commerciale.entity.Affaire;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.AffaireRepository;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.service.AffaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AffaireServiceImpl implements AffaireService {

    private final AffaireRepository affaireRepository;
    private final EntrepriseRepository entrepriseRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AffaireDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable) {
        boolean onlyActive = Boolean.TRUE.equals(actifOnly);
        Page<Affaire> page;

        if (entrepriseId != null) {
            page = onlyActive
                ? affaireRepository.findByEntrepriseIdAndActifTrue(entrepriseId, pageable)
                : affaireRepository.findByEntrepriseId(entrepriseId, pageable);
        } else {
            page = onlyActive
                ? affaireRepository.findByActifTrue(pageable)
                : affaireRepository.findAll(pageable);
        }
        return page.map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public AffaireDTO findById(Integer id) {
        return toDTO(affaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affaire", id)));
    }

    @Override
    public AffaireDTO create(AffaireDTO dto) {
        Affaire a = new Affaire();
        applyDTO(dto, a);
        return toDTO(affaireRepository.save(a));
    }

    @Override
    public AffaireDTO update(Integer id, AffaireDTO dto) {
        Affaire a = affaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affaire", id));
        applyDTO(dto, a);
        return toDTO(affaireRepository.save(a));
    }

    @Override
    public void delete(Integer id) {
        affaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affaire", id));
        affaireRepository.deleteById(id);
    }

    @Override
    public AffaireDTO toggleActif(Integer id) {
        Affaire a = affaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affaire", id));
        a.setActif(!Boolean.TRUE.equals(a.getActif()));
        return toDTO(affaireRepository.save(a));
    }

    private void applyDTO(AffaireDTO dto, Affaire a) {
        a.setNom(dto.getNom());
        a.setDescription(dto.getDescription());
        a.setActif(dto.getActif() != null ? dto.getActif() : true);
        if (dto.getEntrepriseId() != null) {
            a.setEntreprise(entrepriseRepository.findById(dto.getEntrepriseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", dto.getEntrepriseId())));
        }
    }

    private AffaireDTO toDTO(Affaire a) {
        return AffaireDTO.builder()
                .id(a.getId()).nom(a.getNom()).description(a.getDescription()).actif(a.getActif())
                .entrepriseId(a.getEntreprise() != null ? a.getEntreprise().getId() : null)
                .entrepriseNom(a.getEntreprise() != null ? a.getEntreprise().getNom() : null)
                .dateCreation(a.getDateCreation())
                .build();
    }
}