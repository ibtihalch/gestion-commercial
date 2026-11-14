package com.gestion.commerciale.controller;

import com.gestion.commerciale.dto.auth.*;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getLogin(), request.getMotDePasse()));

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        Utilisateur user = utilisateurRepository.findByLogin(request.getLogin()).orElseThrow();
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getNom().name()).collect(Collectors.toList());

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .id(user.getId())
                .login(user.getLogin())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .roles(roles)
                .entrepriseId(user.getEntreprise() != null ? user.getEntreprise().getId() : null)
                .build();

        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("data", authResponse);
        body.put("message", "Connexion réussie");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/register")
    @Operation(summary = "Inscription utilisateur")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if (utilisateurRepository.existsByLogin(request.getLogin())) {
            throw new BadRequestException("Ce login est déjà utilisé");
        }

        Utilisateur user = new Utilisateur();
        user.setLogin(request.getLogin());
        user.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());
        user.setEmail(request.getEmail());
        user.setActif(true);

        if (request.getEntrepriseId() != null) {
            entrepriseRepository.findById(request.getEntrepriseId())
                    .ifPresent(user::setEntreprise);
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            roleRepository.findByNom(ERole.ROLE_CONSULTANT).ifPresent(roles::add);
        } else {
            request.getRoles().forEach(roleName -> {
                try {
                    ERole eRole = ERole.valueOf("ROLE_" + roleName.toUpperCase());
                    roleRepository.findByNom(eRole).ifPresent(roles::add);
                } catch (IllegalArgumentException ignored) {}
            });
        }
        user.setRoles(roles);

        utilisateurRepository.save(user);

        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "Utilisateur créé avec succès");
        return ResponseEntity.ok(body);
    }
}
