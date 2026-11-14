package com.gestion.commerciale.dto.auth;

import lombok.*;

import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String type = "Bearer";
    private Integer id;
    private String login;
    private String nom;
    private String prenom;
    private String email;
    private List<String> roles;
    private Integer entrepriseId;
}
