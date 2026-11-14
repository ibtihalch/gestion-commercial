package com.gestion.commerciale.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
public class NumeroGeneratorService {

    private final Map<String, Long> derniersNumerosReserves = new HashMap<>();

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public synchronized String generer(String prefixe, String table, String colonne) {
        validateIdentifier(prefixe, "préfixe");
        validateIdentifier(table, "table");
        validateIdentifier(colonne, "colonne");

        int annee = LocalDate.now().getYear();
        String pattern = prefixe + "-" + annee + "-%";

        Number maxExistant = (Number) em.createNativeQuery(
                "SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(" + colonne + ", '-', -1) AS UNSIGNED)), 0) " +
                "FROM " + table + " WHERE " + colonne + " LIKE :pattern")
                .setParameter("pattern", pattern)
                .getSingleResult();

        String sequenceKey = table + ":" + colonne + ":" + prefixe + ":" + annee;
        long dernierReserve = derniersNumerosReserves.getOrDefault(sequenceKey, 0L);
        long prochainNumero = Math.max(maxExistant.longValue(), dernierReserve) + 1;
        derniersNumerosReserves.put(sequenceKey, prochainNumero);

        return String.format("%s-%d-%04d", prefixe, annee, prochainNumero);
    }

    private void validateIdentifier(String value, String label) {
        if (value == null || !value.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            throw new IllegalArgumentException("Identifiant de " + label + " invalide");
        }
    }
}
