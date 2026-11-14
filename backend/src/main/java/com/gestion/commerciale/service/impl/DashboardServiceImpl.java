package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.DashboardDTO;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final ClientRepository             clientRepository;
    private final FournisseurRepository        fournisseurRepository;
    private final ArticleRepository            articleRepository;
    private final DevisRepository              devisRepository;
    private final FactureClientRepository      factureClientRepository;
    private final BonCommandeClientRepository  bonCommandeClientRepository;

    private static final String[] MOIS = {
        "Jan","Fév","Mar","Avr","Mai","Jun",
        "Jul","Aoû","Sep","Oct","Nov","Déc"
    };

    // ── Stats globales (inchangé) ─────────────────────────────────────────────

    @Override
    public DashboardDTO getStats(Integer entrepriseId) {
        return DashboardDTO.builder()
                .totalClients(entrepriseId != null
                        ? clientRepository.countByEntrepriseId(entrepriseId)
                        : clientRepository.count())
                .totalFournisseurs(entrepriseId != null
                        ? fournisseurRepository.countByEntrepriseId(entrepriseId)
                        : fournisseurRepository.count())
                .totalArticles(entrepriseId != null
                        ? articleRepository.countByEntrepriseId(entrepriseId)
                        : articleRepository.count())
                .totalDevis(entrepriseId != null
                        ? devisRepository.countByEntrepriseId(entrepriseId)
                        : devisRepository.count())
                .articlesAlerteStock(articleRepository.findArticlesSousSeuilAlerte().size())
                .chiffreAffaires(entrepriseId != null
                        ? safe(factureClientRepository.sumPayeesByEntrepriseId(entrepriseId))
                        : BigDecimal.ZERO)
                .facturesImpayees(entrepriseId != null
                        ? safe(factureClientRepository.sumImpayeesByEntrepriseId(entrepriseId))
                        : BigDecimal.ZERO)
                .facturesPayees(entrepriseId != null
                        ? safe(factureClientRepository.sumPayeesByEntrepriseId(entrepriseId))
                        : BigDecimal.ZERO)
                .totalCommandesClient(entrepriseId != null
                        ? safe(bonCommandeClientRepository.sumMontantTtcByEntrepriseId(entrepriseId))
                        : BigDecimal.ZERO)
                .build();
    }

    // ── CA mensuel réel par année ─────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getCaMensuel(Integer entrepriseId, int annee) {

        // Récupère les données brutes depuis le repo : [mois(1-12), montantHt]
        List<Object[]> rows = factureClientRepository
                .sumPayeesByMoisAndAnnee(entrepriseId, annee);

        // Indexer par numéro de mois pour lookup O(1)
        Map<Integer, BigDecimal> byMois = new HashMap<>();
        for (Object[] row : rows) {
            Integer mois   = ((Number) row[0]).intValue();
            BigDecimal montant = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            byMois.put(mois, montant);
        }

        // Construire les 12 mois, 0 si pas de données
        List<Map<String, Object>> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("mois",    MOIS[m - 1]);
            point.put("montant", byMois.getOrDefault(m, BigDecimal.ZERO));
            result.add(point);
        }
        return result;
    }

    private BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}