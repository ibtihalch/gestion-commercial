package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.ArticleDTO;
import com.gestion.commerciale.service.ArticleService;
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
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Tag(name = "Articles")
@SecurityRequirement(name = "bearerAuth")
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping
    @Operation(summary = "Liste paginée des articles")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")    int     page,
            @RequestParam(defaultValue = "10")   int     size,
            @RequestParam(defaultValue = "code") String  sortBy,
            @RequestParam(required = false) Integer entrepriseId,
            @RequestParam(required = false) Integer familleId,
            @RequestParam(required = false) Integer sousFamilleId,
            @RequestParam(required = false) String  search,
            @RequestParam(required = false) Boolean actifOnly) {  // ← nouveau

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ok(articleService.findAll(entrepriseId, familleId, sousFamilleId, search, actifOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(articleService.findById(id));
    }

    @GetMapping("/alertes")
    public ResponseEntity<Map<String, Object>> getAlertes() {
        return ok(articleService.findAlertes());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody ArticleDTO dto) {
        return ok(articleService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody ArticleDTO dto) {
        return ok(articleService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Activer / désactiver un article (admin)")
    public ResponseEntity<Map<String, Object>> toggleActif(@PathVariable Integer id) {
        return ok(articleService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        articleService.delete(id);
        return deleted("Article supprimé");
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