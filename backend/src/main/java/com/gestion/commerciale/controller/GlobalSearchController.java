package com.gestion.commerciale.controller;

import com.gestion.commerciale.service.impl.GlobalSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {
    private final GlobalSearchService globalSearchService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam String q,
            @RequestParam(defaultValue = "5") int limit, Authentication auth) {
        return ResponseEntity.ok(Map.of("success", true,
                "data", globalSearchService.search(auth.getName(), q, limit)));
    }
}
