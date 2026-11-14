package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.FamilleDTO;
import com.gestion.commerciale.dto.SousFamilleDTO;
import com.gestion.commerciale.entity.Famille;
import com.gestion.commerciale.entity.SousFamille;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.repository.FamilleRepository;
import com.gestion.commerciale.repository.SousFamilleRepository;
import com.gestion.commerciale.service.FamilleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FamilleServiceImpl implements FamilleService {

    private final FamilleRepository familleRepository;
    private final SousFamilleRepository sousFamilleRepository;
    private final EntrepriseRepository entrepriseRepository;

    // =========================================================================
    // Famille
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<FamilleDTO> findAllFamilles(Integer entrepriseId, Pageable pageable) {
        Page<Famille> page = entrepriseId != null
                ? familleRepository.findByEntrepriseId(entrepriseId, pageable)
                : familleRepository.findAll(pageable);
        return page.map(this::toFamilleDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public FamilleDTO findFamilleById(Integer id) {
        return toFamilleDTO(findFamilleOrThrow(id));
    }

    @Override
    public FamilleDTO createFamille(FamilleDTO dto) {
        if (familleRepository.existsByCode(dto.getCode()))
            throw new BadRequestException("Une famille avec ce code existe déjà : " + dto.getCode());

        Famille famille = new Famille();
        applyFamilleDTO(dto, famille);
        return toFamilleDTO(familleRepository.save(famille));
    }

    @Override
    public FamilleDTO updateFamille(Integer id, FamilleDTO dto) {
        Famille famille = findFamilleOrThrow(id);
        if (!famille.getCode().equals(dto.getCode())
                && familleRepository.existsByCodeAndIdNot(dto.getCode(), id))
            throw new BadRequestException("Ce code famille est déjà utilisé : " + dto.getCode());

        applyFamilleDTO(dto, famille);
        return toFamilleDTO(familleRepository.save(famille));
    }

    @Override
    public void deleteFamille(Integer id) {
        findFamilleOrThrow(id);
        familleRepository.deleteById(id);
    }

    // =========================================================================
    // Sous-famille
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<SousFamilleDTO> findAllSousFamilles(Integer familleId, Pageable pageable) {
        Page<SousFamille> page = familleId != null
                ? sousFamilleRepository.findByFamilleId(familleId, pageable)
                : sousFamilleRepository.findAll(pageable);
        return page.map(this::toSousFamilleDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SousFamilleDTO> findSousFamillesByFamille(Integer familleId) {
        return sousFamilleRepository.findByFamilleId(familleId).stream()
                .map(this::toSousFamilleDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SousFamilleDTO findSousFamilleById(Integer id) {
        return toSousFamilleDTO(findSousFamilleOrThrow(id));
    }

    @Override
    public SousFamilleDTO createSousFamille(SousFamilleDTO dto) {
        if (sousFamilleRepository.existsByCodeAndFamilleId(dto.getCode(), dto.getFamilleId()))
            throw new BadRequestException(
                    "Une sous-famille avec ce code existe déjà dans cette famille : " + dto.getCode());

        SousFamille sf = new SousFamille();
        applySousFamilleDTO(dto, sf);
        return toSousFamilleDTO(sousFamilleRepository.save(sf));
    }

    @Override
    public SousFamilleDTO updateSousFamille(Integer id, SousFamilleDTO dto) {
        SousFamille sf = findSousFamilleOrThrow(id);
        if (!sf.getCode().equals(dto.getCode())
                && sousFamilleRepository.existsByCodeAndFamilleIdAndIdNot(
                        dto.getCode(), dto.getFamilleId(), id))
            throw new BadRequestException("Ce code sous-famille est déjà utilisé dans cette famille.");

        applySousFamilleDTO(dto, sf);
        return toSousFamilleDTO(sousFamilleRepository.save(sf));
    }

    @Override
    public void deleteSousFamille(Integer id) {
        findSousFamilleOrThrow(id);
        sousFamilleRepository.deleteById(id);
    }

    // =========================================================================
    // Helpers privés
    // =========================================================================

    private Famille findFamilleOrThrow(Integer id) {
        return familleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Famille", id));
    }

    private SousFamille findSousFamilleOrThrow(Integer id) {
        return sousFamilleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SousFamille", id));
    }

    private void applyFamilleDTO(FamilleDTO dto, Famille famille) {
        famille.setCode(dto.getCode());
        famille.setLibelle(dto.getLibelle());
        famille.setDescription(dto.getDescription());
        famille.setActif(dto.getActif() != null ? dto.getActif() : true);
        if (dto.getEntrepriseId() != null) {
            famille.setEntreprise(entrepriseRepository.findById(dto.getEntrepriseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", dto.getEntrepriseId())));
        }
    }

    private void applySousFamilleDTO(SousFamilleDTO dto, SousFamille sf) {
        sf.setCode(dto.getCode());
        sf.setLibelle(dto.getLibelle());
        sf.setDescription(dto.getDescription());
        sf.setActif(dto.getActif() != null ? dto.getActif() : true);
        sf.setFamille(findFamilleOrThrow(dto.getFamilleId()));
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private FamilleDTO toFamilleDTO(Famille f) {
        List<SousFamilleDTO> sfList = f.getSousFamilles() == null ? List.of()
                : f.getSousFamilles().stream().map(this::toSousFamilleDTO).collect(Collectors.toList());

        return FamilleDTO.builder()
                .id(f.getId())
                .code(f.getCode())
                .libelle(f.getLibelle())
                .description(f.getDescription())
                .actif(f.getActif())
                .entrepriseId(f.getEntreprise() != null ? f.getEntreprise().getId() : null)
                .sousFamilles(sfList)
                .dateCreation(f.getDateCreation())
                .build();
    }

    private SousFamilleDTO toSousFamilleDTO(SousFamille sf) {
        return SousFamilleDTO.builder()
                .id(sf.getId())
                .code(sf.getCode())
                .libelle(sf.getLibelle())
                .description(sf.getDescription())
                .actif(sf.getActif())
                .familleId(sf.getFamille().getId())
                .familleLibelle(sf.getFamille().getLibelle())
                .dateCreation(sf.getDateCreation())
                .build();
    }
}