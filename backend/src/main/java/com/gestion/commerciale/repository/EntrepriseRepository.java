package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Map;
import java.util.Optional;

public interface EntrepriseRepository extends JpaRepository<Entreprise, Integer>,
        JpaSpecificationExecutor<Entreprise> {

    // ─── Pour l'assistant IA ────────────────────────────────────────────────

    @Query("SELECT new map(e.nom as nom, e.responsable as responsable, e.adresse as adresse, " +
           "e.telephone as telephone, e.email as email, e.ice as ice) " +
           "FROM Entreprise e WHERE e.id = :entrepriseId")
    Optional<Map<String, Object>> findInfosByEntrepriseId(@Param("entrepriseId") Integer entrepriseId);
}