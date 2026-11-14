package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.EntrepriseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EntrepriseService {
    Page<EntrepriseDTO> findAll(Pageable pageable);
    EntrepriseDTO findById(Integer id);
    EntrepriseDTO create(EntrepriseDTO dto);
    EntrepriseDTO update(Integer id, EntrepriseDTO dto);
    void delete(Integer id);
}
