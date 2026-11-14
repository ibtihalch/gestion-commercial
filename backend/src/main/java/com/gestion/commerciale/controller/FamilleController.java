package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.FamilleDTO;
import com.gestion.commerciale.dto.SousFamilleDTO;
import com.gestion.commerciale.service.FamilleService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Familles & Sous-familles")
@SecurityRequirement(name = "bearerAuth")
public class FamilleController {

    private final FamilleService familleService;

    // =========================================================================
    // Familles  →  /api/familles
    // =========================================================================

    @GetMapping("/api/familles")
    public ResponseEntity<Map<String, Object>> getAllFamilles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "libelle") String sortBy,
            @RequestParam(required = false) Integer entrepriseId) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(familleService.findAllFamilles(entrepriseId, pageable));
    }

    @GetMapping("/api/familles/{id}")
    public ResponseEntity<Map<String, Object>> getFamilleById(@PathVariable Integer id) {
        return ok(familleService.findFamilleById(id));
    }

    @PostMapping("/api/familles")
    public ResponseEntity<Map<String, Object>> createFamille(@Valid @RequestBody FamilleDTO dto) {
        return created(familleService.createFamille(dto));
    }

    @PutMapping("/api/familles/{id}")
    public ResponseEntity<Map<String, Object>> updateFamille(
            @PathVariable Integer id, @Valid @RequestBody FamilleDTO dto) {
        return ok(familleService.updateFamille(id, dto));
    }

    @DeleteMapping("/api/familles/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteFamille(@PathVariable Integer id) {
        familleService.deleteFamille(id);
        return deleted("Famille supprimée");
    }

    // =========================================================================
    // Sous-familles  →  /api/sous-familles  &  /api/familles/{id}/sous-familles
    // =========================================================================

    /**
     * Liste paginée de toutes les sous-familles (filtre optionnel par famille).
     * GET /api/sous-familles?familleId=3&page=0&size=20
     */
    @GetMapping("/api/sous-familles")
    public ResponseEntity<Map<String, Object>> getAllSousFamilles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "libelle") String sortBy,
            @RequestParam(required = false) Integer familleId) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(familleService.findAllSousFamilles(familleId, pageable));
    }

    /**
     * Liste plate (non paginée) des sous-familles d'une famille.
     * Utilisée par le front pour alimenter le select en cascade.
     * GET /api/familles/3/sous-familles
     */
    @GetMapping("/api/familles/{familleId}/sous-familles")
    public ResponseEntity<Map<String, Object>> getSousFamillesByFamille(
            @PathVariable Integer familleId) {
        return ok(familleService.findSousFamillesByFamille(familleId));
    }

    @GetMapping("/api/sous-familles/{id}")
    public ResponseEntity<Map<String, Object>> getSousFamilleById(@PathVariable Integer id) {
        return ok(familleService.findSousFamilleById(id));
    }

    @PostMapping("/api/sous-familles")
    public ResponseEntity<Map<String, Object>> createSousFamille(
            @Valid @RequestBody SousFamilleDTO dto) {
        return created(familleService.createSousFamille(dto));
    }

    @PutMapping("/api/sous-familles/{id}")
    public ResponseEntity<Map<String, Object>> updateSousFamille(
            @PathVariable Integer id, @Valid @RequestBody SousFamilleDTO dto) {
        return ok(familleService.updateSousFamille(id, dto));
    }

    @DeleteMapping("/api/sous-familles/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteSousFamille(@PathVariable Integer id) {
        familleService.deleteSousFamille(id);
        return deleted("Sous-famille supprimée");
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        return ResponseEntity.ok(body(data));
    }

    private ResponseEntity<Map<String, Object>> created(Object data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(body(data));
    }

    private ResponseEntity<Map<String, Object>> deleted(String message) {
        Map<String, Object> b = new HashMap<>();
        b.put("success", true);
        b.put("message", message);
        return ResponseEntity.ok(b);
    }

    private Map<String, Object> body(Object data) {
        Map<String, Object> b = new HashMap<>();
        b.put("success", true);
        b.put("data", data);
        return b;
    }
}