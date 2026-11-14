package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.ClientDTO;
import com.gestion.commerciale.service.ClientService;
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
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@Tag(name = "Clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "Liste paginée des clients")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(required = false) Integer entrepriseId,
            @RequestParam(required = false) Boolean actifOnly) {  // ← nouveau

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(clientService.findAll(entrepriseId, actifOnly, pageable));  // ← modifié
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(clientService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody ClientDTO dto) {
        return ok(clientService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody ClientDTO dto) {
        return ok(clientService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle-actif")  // ← nouveau endpoint
    @Operation(summary = "Activer / désactiver un client")
    public ResponseEntity<Map<String, Object>> toggleActif(@PathVariable Integer id) {
        return ok(clientService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        clientService.delete(id);
        return deleted("Client supprimé");
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