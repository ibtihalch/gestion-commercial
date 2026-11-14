package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.AffaireDTO;
import com.gestion.commerciale.service.AffaireService;
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
@RequestMapping("/api/affaires")
@RequiredArgsConstructor
@Tag(name = "Affaires")
@SecurityRequirement(name = "bearerAuth")
public class AffaireController {

    private final AffaireService affaireService;

    @GetMapping
    @Operation(summary = "Liste paginée des affaires")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(required = false) Integer entrepriseId,
            @RequestParam(required = false) Boolean actifOnly) { // ← nouveau

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(affaireService.findAll(entrepriseId, actifOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(affaireService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody AffaireDTO dto) {
        return ok(affaireService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody AffaireDTO dto) {
        return ok(affaireService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Activer / désactiver une affaire (admin)")
    public ResponseEntity<Map<String, Object>> toggleActif(@PathVariable Integer id) {
        return ok(affaireService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        affaireService.delete(id);
        return deleted("Affaire supprimée");
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