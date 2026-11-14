package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.ClientDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClientService {
    Page<ClientDTO> findAll(Integer entrepriseId, Pageable pageable);
    ClientDTO findById(Integer id);
    ClientDTO create(ClientDTO dto);
    ClientDTO update(Integer id, ClientDTO dto);
    void delete(Integer id);
    long count(Integer entrepriseId);
    Page<ClientDTO> findAll(Integer entrepriseId, Boolean actifOnly, Pageable pageable);
    ClientDTO toggleActif(Integer id);  // réservé admin

}
