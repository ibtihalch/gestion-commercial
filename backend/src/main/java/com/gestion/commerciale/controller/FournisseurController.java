package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.FournisseurDTO;
import com.gestion.commerciale.service.FournisseurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
@Tag(name = "Fournisseurs")
@SecurityRequirement(name = "bearerAuth")
public class FournisseurController {

    private final FournisseurService fournisseurService;

    @GetMapping
    @Operation(summary = "Liste paginée des fournisseurs")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(required = false) Integer entrepriseId,
            @RequestParam(required = false) Boolean actifOnly) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(fournisseurService.findAll(entrepriseId, actifOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(fournisseurService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody FournisseurDTO dto) {
        return ok(fournisseurService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody FournisseurDTO dto) {
        return ok(fournisseurService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Activer / désactiver un fournisseur (admin)")
    public ResponseEntity<Map<String, Object>> toggleActif(@PathVariable Integer id) {
        return ok(fournisseurService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        fournisseurService.delete(id);
        return deleted("Fournisseur supprimé");
    }

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    private ResponseEntity<Map<String, Object>> deleted(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", message);
        return ResponseEntity.ok(body);
    }
}