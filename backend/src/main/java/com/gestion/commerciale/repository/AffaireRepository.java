package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Affaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AffaireRepository extends JpaRepository<Affaire, Integer>,
        JpaSpecificationExecutor<Affaire> {

    Page<Affaire> findByEntrepriseId(Integer entrepriseId, Pageable pageable);

    // ← nouveau
    Page<Affaire> findByActifTrue(Pageable pageable);
    Page<Affaire> findByEntrepriseIdAndActifTrue(Integer entrepriseId, Pageable pageable);
    long countByActifTrue();
    long countByEntrepriseIdAndActifTrue(Integer entrepriseId);

    Page<Affaire> findByEntrepriseIdAndActifFalse(Integer entrepriseId, Pageable pageable);
long countByEntrepriseIdAndActifFalse(Integer entrepriseId);
}