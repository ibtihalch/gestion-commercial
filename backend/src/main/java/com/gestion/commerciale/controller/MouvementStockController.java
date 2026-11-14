package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.MouvementStockDTO;
import com.gestion.commerciale.service.MouvementStockService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/mouvements-stock")
@RequiredArgsConstructor
@Tag(name = "Mouvements de stock")
@SecurityRequirement(name = "bearerAuth")
public class MouvementStockController {

    private final MouvementStockService mouvementStockService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer articleId,
            @RequestParam(required = false) Integer entrepriseId) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateMouvement").descending());
        return ok(mouvementStockService.findAll(articleId, entrepriseId, pageable));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody MouvementStockDTO dto) {
        return ok(mouvementStockService.create(dto));
    }

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }
}
