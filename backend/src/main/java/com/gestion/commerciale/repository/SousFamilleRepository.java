package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.SousFamille;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SousFamilleRepository extends JpaRepository<SousFamille, Integer> {

    boolean existsByCodeAndFamilleId(String code, Integer familleId);
    boolean existsByCodeAndFamilleIdAndIdNot(String code, Integer familleId, Integer id);

    /** Toutes les sous-familles d'une famille (pour le filtre en cascade côté front). */
    List<SousFamille> findByFamilleIdAndActif(Integer familleId, Boolean actif);
    List<SousFamille> findByFamilleId(Integer familleId);

    Page<SousFamille> findByFamilleId(Integer familleId, Pageable pageable);
}