package com.gestion.commerciale.config;

import com.gestion.commerciale.entity.ERole;
import com.gestion.commerciale.entity.Entreprise;
import com.gestion.commerciale.entity.Role;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.repository.EntrepriseRepository;
import com.gestion.commerciale.repository.RoleRepository;
import com.gestion.commerciale.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        initDefaultData();
    }

    private void initRoles() {
        for (ERole eRole : ERole.values()) {
            if (roleRepository.findByNom(eRole).isEmpty()) {
                Role role = new Role();
                role.setNom(eRole);
                roleRepository.save(role);
                log.info("Rôle créé : {}", eRole);
            }
        }
    }

    private void initDefaultData() {
        if (utilisateurRepository.count() > 0) return;

        Entreprise entreprise = entrepriseRepository.save(
                Entreprise.builder()
                        .nom("Mon Entreprise")
                        .responsable("Administrateur")
                        .email("contact@monentreprise.ma")
                        .build()
        );
        log.info("Entreprise par défaut créée : {}", entreprise.getNom());

        Role adminRole = roleRepository.findByNom(ERole.ROLE_ADMIN).orElseThrow();

        Utilisateur admin = new Utilisateur();
        admin.setLogin("admin");
        admin.setMotDePasse(passwordEncoder.encode("admin123"));
        admin.setNom("Administrateur");
        admin.setPrenom("Système");
        admin.setEmail("admin@monentreprise.ma");
        admin.setActif(true);
        admin.setEntreprise(entreprise);
        admin.setRoles(Set.of(adminRole));

        utilisateurRepository.save(admin);
        log.info("Utilisateur admin créé — login: admin / mot de passe: admin123");
    }
}
