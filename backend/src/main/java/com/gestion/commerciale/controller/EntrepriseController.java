package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.EntrepriseDTO;
import com.gestion.commerciale.service.EntrepriseService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/entreprises")
@RequiredArgsConstructor
@Tag(name = "Entreprises")
@SecurityRequirement(name = "bearerAuth")
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    // Dans application.properties : app.upload.dir=uploads
    @Value("${app.upload.dir}")
private String uploadDir;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nom"));
        return ok(entrepriseService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ok(entrepriseService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody EntrepriseDTO dto) {
        return ok(entrepriseService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id,
                                                       @Valid @RequestBody EntrepriseDTO dto) {
        return ok(entrepriseService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer id) {
        entrepriseService.delete(id);
        return deleted("Entreprise supprimée");
    }

    // ── Upload logo ────────────────────────────────────────────────────────────
    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadLogo(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file) throws IOException {

        // 1. Validation type MIME
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Fichier image requis (jpg, png, webp...)");
            return ResponseEntity.badRequest().body(err);
        }

        // 2. Validation taille (max 2 Mo)
        if (file.getSize() > 2 * 1024 * 1024) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Image trop lourde (max 2 Mo)");
            return ResponseEntity.badRequest().body(err);
        }

        // 3. Créer le dossier si inexistant
        Path logoDir = Paths.get(uploadDir, "logos");
        Files.createDirectories(logoDir);

        // 4. Supprimer l'ancien logo si existant
        EntrepriseDTO existing = entrepriseService.findById(id);
        if (existing.getLogo() != null && !existing.getLogo().isBlank()) {
            try {
                // Le logo est stocké comme "/uploads/logos/fichier.ext"
                // On enlève le "/" initial pour obtenir le chemin relatif
                Path oldFile = Paths.get(existing.getLogo().replaceFirst("^/", ""));
                Files.deleteIfExists(oldFile);
            } catch (Exception ignored) {
                // Si suppression échoue, on continue quand même
            }
        }

        // 5. Générer un nom unique avec UUID pour éviter les collisions
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "logo";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".png";
        String filename = "entreprise-" + id + "-" + UUID.randomUUID() + extension;

        // 6. Sauvegarder le fichier
        Path filePath = logoDir.resolve(filename);
        Files.write(filePath, file.getBytes());

        // 7. Mettre à jour le champ logo en base (chemin accessible via HTTP)
        String logoUrl = "/uploads/logos/" + filename;
        existing.setLogo(logoUrl);
        EntrepriseDTO updated = entrepriseService.update(id, existing);

        return ok(updated);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
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