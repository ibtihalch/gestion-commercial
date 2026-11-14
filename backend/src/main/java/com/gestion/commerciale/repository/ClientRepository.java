package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Integer>,
        JpaSpecificationExecutor<Client> {

    Page<Client> findByEntrepriseId(Integer entrepriseId, Pageable pageable);
    long countByEntrepriseId(Integer entrepriseId);

    // Création
    boolean existsByNom(String nom);
    boolean existsByEmail(String email);
    boolean existsByIce(String ice);

    // Mise à jour (exclure soi-même)
    boolean existsByNomAndIdNot(String nom, Integer id);
    boolean existsByEmailAndIdNot(String email, Integer id);
    boolean existsByIceAndIdNot(String ice, Integer id);

    // Ajouter ces méthodes
Page<Client> findByActifTrue(Pageable pageable);
Page<Client> findByEntrepriseIdAndActifTrue(Integer entrepriseId, Pageable pageable);
long countByEntrepriseIdAndActifTrue(Integer entrepriseId);
long countByActifTrue();
List<Client> findByEntrepriseIdAndActifTrue(Integer entrepriseId);
}
