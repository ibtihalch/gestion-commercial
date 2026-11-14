package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.UtilisateurDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UtilisateurService {

    Page<UtilisateurDTO> findAll(Pageable pageable);

    UtilisateurDTO findById(Integer id);

    /** Retourne l'utilisateur connecté via son login (pour /me) */
    UtilisateurDTO findByLogin(String login);

    String uploadAvatar(Integer id, MultipartFile file);

    UtilisateurDTO create(UtilisateurDTO dto);

    UtilisateurDTO update(Integer id, UtilisateurDTO dto);

    void delete(Integer id);

    UtilisateurDTO toggleActif(Integer id); // ← NOUVEAU
}