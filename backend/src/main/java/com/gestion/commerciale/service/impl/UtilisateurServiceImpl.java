package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.ProfilDTO;
import com.gestion.commerciale.dto.UtilisateurDTO;
import com.gestion.commerciale.entity.ERole;
import com.gestion.commerciale.entity.ProfilUtilisateur;
import com.gestion.commerciale.entity.Role;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.repository.ProfilUtilisateurRepository;
import com.gestion.commerciale.repository.RoleRepository;
import com.gestion.commerciale.repository.UtilisateurRepository;
import com.gestion.commerciale.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProfilUtilisateurRepository profilUtilisateurRepository;

    // -------------------------------------------------------------------------
    // Lecture
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public Page<UtilisateurDTO> findAll(Pageable pageable) {
        return utilisateurRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public UtilisateurDTO findById(Integer id) {
        return toDTO(utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public UtilisateurDTO findByLogin(String login) {
        return toDTO(utilisateurRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + login)));
    }

    // -------------------------------------------------------------------------
    // Création
    // -------------------------------------------------------------------------

    @Override
    public UtilisateurDTO create(UtilisateurDTO dto) {
        if (utilisateurRepository.existsByLogin(dto.getLogin())) {
            throw new BadRequestException("Ce login est déjà utilisé : " + dto.getLogin());
        }
        if (dto.getEmail() != null && utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Cet email est déjà utilisé : " + dto.getEmail());
        }

        Utilisateur u = new Utilisateur();
        u.setLogin(dto.getLogin());
        u.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        applyFields(dto, u);

        log.info("Création d'un utilisateur : login={}", dto.getLogin());
        return toDTO(utilisateurRepository.save(u));
    }

    // -------------------------------------------------------------------------
    // Upload avatar
    // -------------------------------------------------------------------------

    @Override
    public String uploadAvatar(Integer id, MultipartFile file) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        try {
            Path uploadDir = Paths.get("uploads/avatars");
            Files.createDirectories(uploadDir);

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = "avatar_" + id + "." + extension;
            Path filePath = uploadDir.resolve(filename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/avatars/" + filename;

            ProfilUtilisateur profil = u.getProfil();
            if (profil == null) {
                profil = new ProfilUtilisateur();
                profil.setUtilisateur(u);
            }
            profil.setImg(url);
            profilUtilisateurRepository.save(profil);

            return url;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'upload de l'avatar", e);
        }
    }
    @Override
public UtilisateurDTO toggleActif(Integer id) {
    Utilisateur u = utilisateurRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
    u.setActif(!Boolean.TRUE.equals(u.getActif()));
    log.info("Toggle actif utilisateur : id={}, actif={}", id, u.getActif());
    return toDTO(utilisateurRepository.save(u));
}

    // -------------------------------------------------------------------------
    // Mise à jour
    // -------------------------------------------------------------------------

    @Override
    public UtilisateurDTO update(Integer id, UtilisateurDTO dto) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        if (!u.getLogin().equals(dto.getLogin())
                && utilisateurRepository.existsByLogin(dto.getLogin())) {
            throw new BadRequestException("Ce login est déjà utilisé : " + dto.getLogin());
        }
        if (dto.getEmail() != null
                && !dto.getEmail().equals(u.getEmail())
                && utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Cet email est déjà utilisé : " + dto.getEmail());
        }

        u.setLogin(dto.getLogin());

        if (dto.getMotDePasse() != null && !dto.getMotDePasse().isBlank()) {
            u.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        }

        applyFields(dto, u);

        log.info("Mise à jour de l'utilisateur : id={}, login={}", id, dto.getLogin());
        return toDTO(utilisateurRepository.save(u));
    }

    // -------------------------------------------------------------------------
    // Suppression
    // -------------------------------------------------------------------------

    @Override
    public void delete(Integer id) {
        utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        utilisateurRepository.deleteById(id);
        log.info("Suppression de l'utilisateur : id={}", id);
    }

    // -------------------------------------------------------------------------
    // Méthodes privées
    // -------------------------------------------------------------------------

    private void applyFields(UtilisateurDTO dto, Utilisateur u) {
        u.setNom(dto.getNom());
        u.setPrenom(dto.getPrenom());
        u.setTelephone(dto.getTelephone());
        u.setEmail(dto.getEmail());
        u.setActif(dto.getActif() != null ? dto.getActif() : Boolean.TRUE);

        if (dto.getEntrepriseId() != null) {
            entrepriseRepository.findById(dto.getEntrepriseId())
                    .ifPresent(u::setEntreprise);
        }

        if (dto.getRoles() != null) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : dto.getRoles()) {
                String normalized = roleName.startsWith("ROLE_")
                        ? roleName : "ROLE_" + roleName.toUpperCase();
                ERole eRole;
                try {
                    eRole = ERole.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Rôle inconnu : " + roleName);
                }
                Role role = roleRepository.findByNom(eRole)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", normalized));
                roles.add(role);
            }
            u.setRoles(roles);
        }

        if (dto.getProfil() != null) {
            ProfilUtilisateur profil = u.getProfil();
            if (profil == null) {
                profil = new ProfilUtilisateur();
                profil.setUtilisateur(u);
            }
            ProfilDTO p = dto.getProfil();
            if (p.getBio()       != null) profil.setBio(p.getBio());
            if (p.getPoste()     != null) profil.setPoste(p.getPoste());
            if (p.getSignature() != null) profil.setSignature(p.getSignature());
            profilUtilisateurRepository.save(profil);
            u.setProfil(profil);
        }
    }

    private UtilisateurDTO toDTO(Utilisateur u) {
        ProfilDTO profilDTO = null;
        if (u.getProfil() != null) {
            profilDTO = ProfilDTO.builder()
                    .id(u.getProfil().getId())
                    .img(u.getProfil().getImg())
                    .poste(u.getProfil().getPoste())
                    .bio(u.getProfil().getBio())
                    .signature(u.getProfil().getSignature())
                    .build();
        }

        return UtilisateurDTO.builder()
                .id(u.getId())
                .login(u.getLogin())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .telephone(u.getTelephone())
                .email(u.getEmail())
                .actif(u.getActif())
                .entrepriseId(u.getEntreprise() != null ? u.getEntreprise().getId() : null)
                .entrepriseNom(u.getEntreprise() != null ? u.getEntreprise().getNom() : null)
                .roles(u.getRoles().stream()
                        .map(r -> r.getNom().name())
                        .collect(Collectors.toSet()))
                .dateCreation(u.getDateCreation())
                .profil(profilDTO)
                .build();
    }
}