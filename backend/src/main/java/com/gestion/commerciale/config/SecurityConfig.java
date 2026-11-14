package com.gestion.commerciale.config;

import com.gestion.commerciale.security.CustomUserDetailsService;
import com.gestion.commerciale.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter            jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(new CorsConfig().corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth

                // ── Public ────────────────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(
                    "/swagger-ui/**",
                    "/api-docs/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // ── Utilisateurs : /me — tous les rôles authentifiés ──────
                .requestMatchers(HttpMethod.GET, "/api/utilisateurs/me").authenticated()

                // ── Utilisateurs : GET /{id} — tous les rôles authentifiés ─
                // (pour voir le profil d'un collègue)
                .requestMatchers(HttpMethod.GET, "/api/utilisateurs/{id}").authenticated()

                // ── Utilisateurs : PUT /{id} — tous les rôles authentifiés ─
                // (le controller vérifie self ou admin)
                .requestMatchers(HttpMethod.PUT, "/api/utilisateurs/{id}").authenticated()

                // ── Utilisateurs : POST /{id}/avatar — tous les rôles ─────
                // (le controller vérifie self ou admin)
                .requestMatchers(HttpMethod.POST, "/api/utilisateurs/*/avatar").authenticated()

                // ── Utilisateurs : reste — admin uniquement ───────────────
                // (GET liste, POST créer, DELETE, PATCH toggle)
                .requestMatchers("/api/utilisateurs/**").hasAuthority("ROLE_ADMIN")

                // ── Dashboard : tous les rôles authentifiés ───────────────
                .requestMatchers("/api/dashboard/**").authenticated()

                // ── Tous les endpoints métier : tout utilisateur connecté ──
                .requestMatchers(
                    "/api/clients/**",
                    "/api/fournisseurs/**",
                    "/api/articles/**",
                    "/api/affaires/**",
                    "/api/entreprises/**",
                    "/api/stock/**",
                    "/api/mouvements-stock/**",
                    "/api/devis/**",
                    "/api/bons-commande-client/**",
                    "/api/bons-livraison/**",
                    "/api/factures/**",
                    "/api/factures-client/**",
                    "/api/bons-commande-fournisseur/**",
                    "/api/bons-reception-fournisseur/**",
                    "/api/factures-fournisseur/**"
                ).authenticated()

                // ── Tout le reste : authentifié ───────────────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}