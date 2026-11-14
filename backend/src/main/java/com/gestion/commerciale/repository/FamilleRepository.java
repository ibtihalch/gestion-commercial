package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Famille;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilleRepository extends JpaRepository<Famille, Integer> {

    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Integer id);

    Page<Famille> findByEntrepriseId(Integer entrepriseId, Pageable pageable);
    Page<Famille> findByActif(Boolean actif, Pageable pageable);
    Page<Famille> findByEntrepriseIdAndActif(Integer entrepriseId, Boolean actif, Pageable pageable);
    long countByEntrepriseIdAndActifTrue(Integer entrepriseId);
    Page<Famille> findByEntrepriseIdAndActifTrueOrderByLibelleAsc(Integer entrepriseId, Pageable pageable);
}
