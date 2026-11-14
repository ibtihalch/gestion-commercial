package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.EntrepriseDTO;
import com.gestion.commerciale.entity.Entreprise;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.service.EntrepriseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class EntrepriseServiceImpl implements EntrepriseService {

    private final EntrepriseRepository entrepriseRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<EntrepriseDTO> findAll(Pageable pageable) {
        return entrepriseRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public EntrepriseDTO findById(Integer id) {
        return toDTO(entrepriseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id)));
    }

    @Override
    public EntrepriseDTO create(EntrepriseDTO dto) {
        Entreprise e = new Entreprise();
        applyDTO(dto, e);
        return toDTO(entrepriseRepository.save(e));
    }

    @Override
    public EntrepriseDTO update(Integer id, EntrepriseDTO dto) {
        Entreprise e = entrepriseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));
        applyDTO(dto, e);
        return toDTO(entrepriseRepository.save(e));
    }

    @Override
    public void delete(Integer id) {
        entrepriseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Entreprise", id));
        entrepriseRepository.deleteById(id);
    }

    private void applyDTO(EntrepriseDTO dto, Entreprise e) {
        e.setNom(dto.getNom());
        e.setResponsable(dto.getResponsable());
        e.setAdresse(dto.getAdresse());
        e.setTelephone(dto.getTelephone());
        e.setFax(dto.getFax());
        e.setEmail(dto.getEmail());
        e.setIce(dto.getIce());
        e.setIfiscale(dto.getIfiscale());
        e.setCnss(dto.getCnss());
        e.setPatente(dto.getPatente());
        e.setRc(dto.getRc());
        e.setCompteBancaire(dto.getCompteBancaire());
        e.setSiteWeb(dto.getSiteWeb());
        e.setLogo(dto.getLogo());
        e.setDescription(dto.getDescription());
    }

    private EntrepriseDTO toDTO(Entreprise e) {
        return EntrepriseDTO.builder()
                .id(e.getId()).nom(e.getNom()).responsable(e.getResponsable())
                .adresse(e.getAdresse()).telephone(e.getTelephone()).fax(e.getFax())
                .email(e.getEmail()).ice(e.getIce()).ifiscale(e.getIfiscale())
                .cnss(e.getCnss()).patente(e.getPatente()).rc(e.getRc())
                .compteBancaire(e.getCompteBancaire()).siteWeb(e.getSiteWeb())
                .logo(e.getLogo()).description(e.getDescription())
                .dateCreation(e.getDateCreation())
                .build();
    }
}
