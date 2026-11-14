package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.ClientDTO;
import com.gestion.commerciale.entity.Client;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.ClientRepository;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final EntrepriseRepository entrepriseRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ClientDTO> findAll(Integer entrepriseId, Pageable pageable) {
        Page<Client> page = entrepriseId != null
                ? clientRepository.findByEntrepriseId(entrepriseId, pageable)
                : clientRepository.findAll(pageable);
        return page.map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public ClientDTO findById(Integer id) {
        return toDTO(clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id)));
    }

    @Override
    public ClientDTO create(ClientDTO dto) {
        if (clientRepository.existsByNom(dto.getNom()))
            throw new BadRequestException("Un client avec le nom '" + dto.getNom() + "' existe déjà");
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && clientRepository.existsByEmail(dto.getEmail()))
            throw new BadRequestException("Un client avec l'email '" + dto.getEmail() + "' existe déjà");
        if (dto.getIce() != null && !dto.getIce().isBlank() && clientRepository.existsByIce(dto.getIce()))
            throw new BadRequestException("Un client avec l'ICE '" + dto.getIce() + "' existe déjà");

        Client client = new Client();
        applyDTO(dto, client);
        return toDTO(clientRepository.save(client));
    }

    @Override
    public ClientDTO update(Integer id, ClientDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));

        if (clientRepository.existsByNomAndIdNot(dto.getNom(), id))
            throw new BadRequestException("Un client avec le nom '" + dto.getNom() + "' existe déjà");
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && clientRepository.existsByEmailAndIdNot(dto.getEmail(), id))
            throw new BadRequestException("Un client avec l'email '" + dto.getEmail() + "' existe déjà");
        if (dto.getIce() != null && !dto.getIce().isBlank() && clientRepository.existsByIceAndIdNot(dto.getIce(), id))
            throw new BadRequestException("Un client avec l'ICE '" + dto.getIce() + "' existe déjà");

        applyDTO(dto, client);
        return toDTO(clientRepository.save(client));
    }
    @Override
@Transactional(readOnly = true)
public Page<ClientDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable) {
    Page<Client> page;
    boolean onlyActive = Boolean.TRUE.equals(actifOnly);

    if (entrepriseId != null) {
        page = onlyActive
            ? clientRepository.findByEntrepriseIdAndActifTrue(entrepriseId, pageable)
            : clientRepository.findByEntrepriseId(entrepriseId, pageable);
    } else {
        page = onlyActive
            ? clientRepository.findByActifTrue(pageable)
            : clientRepository.findAll(pageable);
    }
    return page.map(this::toDTO);
}

@Override
public ClientDTO toggleActif(Integer id) {
    Client client = clientRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Client", id));
    client.setActif(!Boolean.TRUE.equals(client.getActif()));
    return toDTO(clientRepository.save(client));
}

    @Override
    public void delete(Integer id) {
        clientRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Client", id));
        clientRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long count(Integer entrepriseId) {
        return entrepriseId != null
                ? clientRepository.countByEntrepriseId(entrepriseId)
                : clientRepository.count();
    }

    private void applyDTO(ClientDTO dto, Client client) {
        client.setNom(dto.getNom());
        client.setAdresse(dto.getAdresse());
        client.setTelephone(dto.getTelephone());
        client.setEmail(dto.getEmail());
        client.setActif(dto.getActif() != null ? dto.getActif() : true);
        client.setIce(dto.getIce());
        if (dto.getEntrepriseId() != null) {
            client.setEntreprise(entrepriseRepository.findById(dto.getEntrepriseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entreprise", dto.getEntrepriseId())));
        }
    }

    private ClientDTO toDTO(Client c) {
        return ClientDTO.builder()
                .id(c.getId()).nom(c.getNom()).adresse(c.getAdresse())
                .telephone(c.getTelephone()).email(c.getEmail()).actif(c.getActif())
                .ice(c.getIce())
                .entrepriseId(c.getEntreprise() != null ? c.getEntreprise().getId() : null)
                .entrepriseNom(c.getEntreprise() != null ? c.getEntreprise().getNom() : null)
                .dateCreation(c.getDateCreation())
                .build();
    }
}