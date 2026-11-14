package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.FournisseurDTO;
import com.gestion.commerciale.entity.Fournisseur;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.repository.FournisseurRepository;
import com.gestion.commerciale.service.FournisseurService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FournisseurServiceImpl implements FournisseurService {

    private final FournisseurRepository fournisseurRepository;
    private final EntrepriseRepository entrepriseRepository;

   @Override
@Transactional(readOnly = true)
public Page<FournisseurDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable) {
    boolean onlyActive = Boolean.TRUE.equals(actifOnly);
    Page<Fournisseur> page;

    if (entrepriseId != null) {
        page = onlyActive
            ? fournisseurRepository.findByEntrepriseIdAndActifTrue(entrepriseId, pageable)
            : fournisseurRepository.findByEntrepriseId(entrepriseId, pageable);
    } else {
        page = onlyActive
            ? fournisseurRepository.findByActifTrue(pageable)
            : fournisseurRepository.findAll(pageable);
    }
    return page.map(this::toDTO);
}

@Override
public FournisseurDTO toggleActif(Integer id) {
    Fournisseur f = fournisseurRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", id));
    f.setActif(!Boolean.TRUE.equals(f.getActif()));
    return toDTO(fournisseurRepository.save(f));
}

    @Override
    @Transactional(readOnly = true)
    public FournisseurDTO findById(Integer id) {
        return toDTO(fournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", id)));
    }

    @Override
    public FournisseurDTO create(FournisseurDTO dto) {
        if (fournisseurRepository.existsByNom(dto.getNom()))
            throw new BadRequestException("Un fournisseur avec le nom '" + dto.getNom() + "' existe déjà");
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && fournisseurRepository.existsByEmail(dto.getEmail()))
            throw new BadRequestException("Un fournisseur avec l'email '" + dto.getEmail() + "' existe déjà");
        if (dto.getIce() != null && !dto.getIce().isBlank() && fournisseurRepository.existsByIce(dto.getIce()))
            throw new BadRequestException("Un fournisseur avec l'ICE '" + dto.getIce() + "' existe déjà");

        Fournisseur f = new Fournisseur();
        applyDTO(dto, f);
        return toDTO(fournisseurRepository.save(f));
    }

    @Override
    public FournisseurDTO update(Integer id, FournisseurDTO dto) {
        Fournisseur f = fournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", id));

        if (fournisseurRepository.existsByNomAndIdNot(dto.getNom(), id))
            throw new BadRequestException("Un fournisseur avec le nom '" + dto.getNom() + "' existe déjà");
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && fournisseurRepository.existsByEmailAndIdNot(dto.getEmail(), id))
            throw new BadRequestException("Un fournisseur avec l'email '" + dto.getEmail() + "' existe déjà");
        if (dto.getIce() != null && !dto.getIce().isBlank() && fournisseurRepository.existsByIceAndIdNot(dto.getIce(), id))
            throw new BadRequestException("Un fournisseur avec l'ICE '" + dto.getIce() + "' existe déjà");

        applyDTO(dto, f);
        return toDTO(fournisseurRepository.save(f));
    }
    

    @Override
    public void delete(Integer id) {
        fournisseurRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fournisseur", id));
        fournisseurRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long count(Integer entrepriseId) {
        return entrepriseId != null
                ? fournisseurRepository.countByEntrepriseId(entrepriseId)
                : fournisseurRepository.count();
    }

    private void applyDTO(FournisseurDTO dto, Fournisseur f) {
        f.setNom(dto.getNom());
        f.setAdresse(dto.getAdresse());
        f.setTelephone(dto.getTelephone());
        f.setEmail(dto.getEmail());
        f.setActif(dto.getActif() != null ? dto.getActif() : true);
        f.setIce(dto.getIce());
        if (dto.getEntrepriseId() != null) {
            f.setEntreprise(entrepriseRepository.findById(dto.getEntrepriseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", dto.getEntrepriseId())));
        }
    }

    private FournisseurDTO toDTO(Fournisseur f) {
        return FournisseurDTO.builder()
                .id(f.getId()).nom(f.getNom()).adresse(f.getAdresse())
                .telephone(f.getTelephone()).email(f.getEmail()).actif(f.getActif())
                .ice(f.getIce())
                .entrepriseId(f.getEntreprise() != null ? f.getEntreprise().getId() : null)
                .entrepriseNom(f.getEntreprise() != null ? f.getEntreprise().getNom() : null)
                .dateCreation(f.getDateCreation())
                .build();
    }
}