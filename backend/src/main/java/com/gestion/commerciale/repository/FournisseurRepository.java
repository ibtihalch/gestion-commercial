package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Fournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Integer>,
        JpaSpecificationExecutor<Fournisseur> {

    Page<Fournisseur> findByEntrepriseId(Integer entrepriseId, Pageable pageable);
    long countByEntrepriseId(Integer entrepriseId);

    // ← nouveau
    Page<Fournisseur> findByActifTrue(Pageable pageable);
    Page<Fournisseur> findByEntrepriseIdAndActifTrue(Integer entrepriseId, Pageable pageable);
    long countByActifTrue();
    long countByEntrepriseIdAndActifTrue(Integer entrepriseId);
    Page<Fournisseur> findByEntrepriseIdAndActifTrueOrderByNomAsc(Integer entrepriseId, Pageable pageable);

    boolean existsByNom(String nom);
    boolean existsByEmail(String email);
    boolean existsByIce(String ice);

    boolean existsByNomAndIdNot(String nom, Integer id);
    boolean existsByEmailAndIdNot(String email, Integer id);
    boolean existsByIceAndIdNot(String ice, Integer id);
}
