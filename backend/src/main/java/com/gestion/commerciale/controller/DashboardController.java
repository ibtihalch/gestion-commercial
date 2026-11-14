package com.gestion.commerciale.controller;

import com.gestion.commerciale.service.DashboardService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    // ── Stats globales (inchangé) ──────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(required = false) Integer entrepriseId) {

        return ok(dashboardService.getStats(entrepriseId));
    }

    // ── CA mensuel réel ────────────────────────────────────────────────────────
    // GET /api/dashboard/ca-mensuel?entrepriseId=1&annee=2026

    @GetMapping("/ca-mensuel")
    public ResponseEntity<Map<String, Object>> getCaMensuel(
            @RequestParam(required = false) Integer entrepriseId,
            @RequestParam(defaultValue = "0")  int annee) {

        // annee=0 → année courante
        int anneeReelle = annee > 0 ? annee : LocalDate.now().getYear();
        return ok(dashboardService.getCaMensuel(entrepriseId, anneeReelle));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }
}