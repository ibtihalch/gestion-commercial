package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.assistant.ChatRequestDTO;
import com.gestion.commerciale.dto.assistant.ChatResponseDTO;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.UtilisateurRepository;
import com.gestion.commerciale.service.impl.AssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
@Tag(name = "Assistant IA")
@SecurityRequirement(name = "bearerAuth")
public class AssistantController {

    private final AssistantService assistantService;
    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/chat")
    @Operation(summary = "Poser une question à l'assistant IA sur les données de l'entreprise")
    public ResponseEntity<Map<String, Object>> chat(
            @Valid @RequestBody ChatRequestDTO request,
            Authentication auth) {

        Utilisateur utilisateur = getUtilisateurConnecte(auth);
        Integer entrepriseId = utilisateur.getEntreprise().getId();

        ChatResponseDTO response = assistantService.chat(request.getMessage(), entrepriseId, utilisateur.getId());
        return ok(response);
    }

    @DeleteMapping("/history")
    @Operation(summary = "Effacer l'historique de conversation de l'utilisateur connecté")
    public ResponseEntity<Map<String, Object>> clearHistory(Authentication auth) {
        Utilisateur utilisateur = getUtilisateurConnecte(auth);
        assistantService.clearHistory(utilisateur.getEntreprise().getId(), utilisateur.getId());
        return ok(Map.of("message", "Historique de conversation effacé"));
    }

    private Utilisateur getUtilisateurConnecte(Authentication auth) {
        Utilisateur utilisateur = utilisateurRepository.findByLogin(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur connecté introuvable"));
        if (utilisateur.getEntreprise() == null) {
            throw new BadRequestException("Aucune entreprise n'est associée à l'utilisateur connecté");
        }
        return utilisateur;
    }

    private ResponseEntity<Map<String, Object>> ok(Object data) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }
}
