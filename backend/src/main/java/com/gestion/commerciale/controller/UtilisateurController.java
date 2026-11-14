package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.UtilisateurDTO;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.UtilisateurRepository;
import com.gestion.commerciale.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Gestion des comptes utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UtilisateurController {

    private final UtilisateurService    utilisateurService;
    private final UtilisateurRepository utilisateurRepository;

    // -------------------------------------------------------------------------
    // GET /api/utilisateurs/me — accessible à TOUS les rôles authentifiés
    // -------------------------------------------------------------------------
    @GetMapping("/me")
    @Operation(summary = "Récupérer mon profil", description = "Retourne le profil de l'utilisateur connecté.")
    public ResponseEntity<UtilisateurDTO> getMe(Principal principal) {
        return ResponseEntity.ok(
            utilisateurService.findByLogin(principal.getName())
        );
    }

    // -------------------------------------------------------------------------
    // GET /api/utilisateurs — liste paginée (admin uniquement)
    // -------------------------------------------------------------------------
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Lister les utilisateurs", description = "Retourne la liste paginée triée par login.")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("login"));
        Page<UtilisateurDTO> result = utilisateurService.findAll(pageable);

        Map<String, Object> body = new HashMap<>();
        body.put("success",       true);
        body.put("data",          result.getContent());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages",    result.getTotalPages());
        body.put("currentPage",   result.getNumber());
        return ResponseEntity.ok(body);
    }

    // -------------------------------------------------------------------------
    // GET /api/utilisateurs/{id} — accessible à TOUS les rôles authentifiés
    // -------------------------------------------------------------------------
    @GetMapping("/{id}")
    @Operation(summary = "Trouver un utilisateur par ID")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(utilisateurService.findById(id));
    }

    // -------------------------------------------------------------------------
    // POST /api/utilisateurs — admin uniquement
    // -------------------------------------------------------------------------
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Créer un utilisateur")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody UtilisateurDTO dto) {
        return ok(utilisateurService.create(dto));
    }

    // -------------------------------------------------------------------------
    // PUT /api/utilisateurs/{id} — admin OU l'utilisateur lui-même
    // -------------------------------------------------------------------------
    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un utilisateur")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UtilisateurDTO dto,
            Principal principal) {

        Utilisateur current = utilisateurRepository.findByLogin(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", principal.getName()));

        boolean isAdmin = current.getRoles().stream()
                .anyMatch(r -> r.getNom().name().equals("ROLE_ADMIN"));
        boolean isSelf  = current.getId().equals(id);

        if (!isAdmin && !isSelf) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Accès refusé"));
        }

        // Un non-admin ne peut pas modifier ses propres rôles ni son statut actif
        if (!isAdmin) {
            dto.setRoles(current.getRoles().stream()
                    .map(r -> r.getNom().name())
                    .collect(Collectors.toSet()));
            dto.setActif(current.getActif());
        }

        return ok(utilisateurService.update(id, dto));
    }

    // -------------------------------------------------------------------------
    // PATCH /api/utilisateurs/{id}/toggle-actif — admin uniquement
    // -------------------------------------------------------------------------
    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Activer / désactiver un utilisateur")
    public ResponseEntity<Map<String, Object>> toggleActif(@PathVariable Integer id) {
        return ok(utilisateurService.toggleActif(id));
    }

    // -------------------------------------------------------------------------
    // POST /api/utilisateurs/{id}/avatar — admin OU l'utilisateur lui-même
    // -------------------------------------------------------------------------
    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar utilisateur")
    public ResponseEntity<?> uploadAvatar(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        Utilisateur current = utilisateurRepository.findByLogin(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", principal.getName()));

        boolean isAdmin = current.getRoles().stream()
                .anyMatch(r -> r.getNom().name().equals("ROLE_ADMIN"));
        boolean isSelf  = current.getId().equals(id);

        if (!isAdmin && !isSelf) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Accès refusé"));
        }

        String url = utilisateurService.uploadAvatar(id, file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/utilisateurs/{id} — admin uniquement
    // -------------------------------------------------------------------------
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Supprimer un utilisateur")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        utilisateurService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------
    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data",    data);
        return ResponseEntity.ok(body);
    }
}