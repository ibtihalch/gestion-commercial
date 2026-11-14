package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantDataService {

    private final FactureClientRepository factureClientRepository;
    private final DevisRepository devisRepository;
    private final AffaireRepository affaireRepository;
    private final ArticleRepository articleRepository;
    private final FactureFournisseurRepository factureFournisseurRepository;
    private final FournisseurRepository fournisseurRepository;
    private final BonCommandeClientRepository bonCommandeClientRepository;
    private final BonCommandeFournisseurRepository bonCommandeFournisseurRepository;
    private final BonLivraisonRepository bonLivraisonRepository;
    private final BonReceptionFournisseurRepository bonReceptionFournisseurRepository;
    private final PaiementRepository paiementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final ClientRepository clientRepository;
    private final FamilleRepository familleRepository;
    private final MouvementStockRepository mouvementStockRepository;

    // ─── Clients / Ventes ─────────────────────────────────────────────────────

    public List<Map<String, Object>> getClientsImpayes(Integer entrepriseId, int limit) {
        return factureClientRepository.findClientsImpayes(entrepriseId, PageRequest.of(0, limit));
    }

    public BigDecimal getCaPeriode(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        return factureClientRepository.sumCaPeriode(entrepriseId, debut, fin);
    }

    public List<Map<String, Object>> getMeilleursClients(Integer entrepriseId, int limit) {
        return factureClientRepository.findMeilleursClients(entrepriseId, PageRequest.of(0, limit));
    }
    public long getNombreClients(Integer entrepriseId) {
    return clientRepository.countByEntrepriseIdAndActifTrue(entrepriseId);
}
    public List<String> getListeClients(Integer entrepriseId, int limit) {
    return clientRepository.findByEntrepriseIdAndActifTrue(entrepriseId, PageRequest.of(0, limit))
            .getContent()
            .stream()
            .map(com.gestion.commerciale.entity.Client::getNom)
            .toList();
}

    // ─── Devis ────────────────────────────────────────────────────────────────

    public long getNombreDevis(Integer entrepriseId) {
        return devisRepository.countByEntrepriseId(entrepriseId);
    }

    public List<Map<String, Object>> getDevisEnAttente(Integer entrepriseId, int limit) {
        return devisRepository.findDevisEnAttente(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getDevisExpires(Integer entrepriseId, int limit) {
        return devisRepository.findDevisExpires(entrepriseId, PageRequest.of(0, limit));
    }

    public BigDecimal getMontantDevisAcceptes(Integer entrepriseId) {
        return devisRepository.sumMontantTtcAccepteByEntrepriseId(entrepriseId);
    }

    // ─── Affaires ─────────────────────────────────────────────────────────────

    public long getAffairesActives(Integer entrepriseId) {
        return affaireRepository.countByEntrepriseIdAndActifTrue(entrepriseId);
    }
    public List<String> getListeAffaires(Integer entrepriseId, int limit) {
    return affaireRepository.findByEntrepriseIdAndActifTrue(entrepriseId, PageRequest.of(0, limit))
            .getContent()
            .stream()
            .map(com.gestion.commerciale.entity.Affaire::getNom)
            .toList();
}
    public List<String> getAffairesInactives(Integer entrepriseId, int limit) {
    return affaireRepository.findByEntrepriseIdAndActifFalse(entrepriseId, PageRequest.of(0, limit))
            .getContent()
            .stream()
            .map(com.gestion.commerciale.entity.Affaire::getNom)
            .toList();
}

    // ─── Articles / Stock ─────────────────────────────────────────────────────

    public long getNombreArticles(Integer entrepriseId) {
        return articleRepository.countByEntrepriseIdAndActifTrue(entrepriseId);
    }

    public List<Map<String, Object>> getArticlesStockFaible(Integer entrepriseId) {
        return articleRepository.findArticlesSousSeuilAlerteByEntrepriseId(entrepriseId);
    }

    public List<Map<String, Object>> getListeArticles(Integer entrepriseId, int limit) {
        return articleRepository.findByEntrepriseIdAndActifTrueOrderByDesignationAsc(entrepriseId, PageRequest.of(0, limit))
                .map(a -> Map.<String, Object>of("code", a.getCode(), "designation", a.getDesignation(),
                        "stock", a.getStock(), "prixVente", a.getPrixVente()))
                .getContent();
    }

    public long getNombreFamilles(Integer entrepriseId) {
        return familleRepository.countByEntrepriseIdAndActifTrue(entrepriseId);
    }

    public List<Map<String, Object>> getListeFamilles(Integer entrepriseId, int limit) {
        return familleRepository.findByEntrepriseIdAndActifTrueOrderByLibelleAsc(entrepriseId, PageRequest.of(0, limit))
                .map(f -> Map.<String, Object>of("code", f.getCode(), "libelle", f.getLibelle()))
                .getContent();
    }

    // ─── Fournisseurs / Achats ────────────────────────────────────────────────

    public long getNombreFournisseurs(Integer entrepriseId) {
        return fournisseurRepository.countByEntrepriseIdAndActifTrue(entrepriseId);
    }

    public List<Map<String, Object>> getFournisseursAPayer(Integer entrepriseId, int limit) {
        return factureFournisseurRepository.findFournisseursAPayer(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getMeilleursFournisseurs(Integer entrepriseId, int limit) {
        return factureFournisseurRepository.findMeilleursFournisseurs(entrepriseId, PageRequest.of(0, limit));
    }

    public BigDecimal getAchatsPeriode(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        return factureFournisseurRepository.sumAchatsPeriode(entrepriseId, debut, fin);
    }

    public List<String> getListeFournisseurs(Integer entrepriseId, int limit) {
        return fournisseurRepository.findByEntrepriseIdAndActifTrueOrderByNomAsc(entrepriseId, PageRequest.of(0, limit))
                .map(com.gestion.commerciale.entity.Fournisseur::getNom).getContent();
    }

    // ─── Commandes / Livraisons / Réceptions ─────────────────────────────────

    public long getCommandesClientEnCours(Integer entrepriseId) {
        return bonCommandeClientRepository.countEnCoursByEntrepriseId(entrepriseId);
    }

    public Map<String, Object> getCommandesFournisseurEnCours(Integer entrepriseId) {
        long nombre = bonCommandeFournisseurRepository.countEnCoursByEntrepriseId(entrepriseId);
        BigDecimal montant = bonCommandeFournisseurRepository.sumMontantTtcByEntrepriseId(entrepriseId);
        return Map.of("nombre", nombre, "montantTotal", montant);
    }

    public long getLivraisonsEnCours(Integer entrepriseId) {
        return bonLivraisonRepository.countEnCoursByEntrepriseId(entrepriseId);
    }

    public long getReceptionsEnAttente(Integer entrepriseId) {
        return bonReceptionFournisseurRepository.countEnCoursByEntrepriseId(entrepriseId);
    }

    public List<Map<String, Object>> getDernieresCommandesClient(Integer entrepriseId, int limit) {
        return bonCommandeClientRepository.findDernieres(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getDernieresCommandesFournisseur(Integer entrepriseId, int limit) {
        return bonCommandeFournisseurRepository.findDernieres(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getDernieresLivraisons(Integer entrepriseId, int limit) {
        return bonLivraisonRepository.findDernieres(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getDernieresReceptions(Integer entrepriseId, int limit) {
        return bonReceptionFournisseurRepository.findDernieres(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getDernieresFacturesClient(Integer entrepriseId, int limit) {
        return factureClientRepository.findDernieresFactures(entrepriseId, PageRequest.of(0, limit));
    }

    public long getNombreFacturesClientImpayees(Integer entrepriseId) {
        return factureClientRepository.countImpayeesByEntrepriseId(entrepriseId);
    }

    public List<Map<String, Object>> getDernieresFacturesFournisseur(Integer entrepriseId, int limit) {
        return factureFournisseurRepository.findDernieresFactures(entrepriseId, PageRequest.of(0, limit));
    }

    public long getNombreFacturesFournisseurImpayees(Integer entrepriseId) {
        return factureFournisseurRepository.countImpayeesByEntrepriseId(entrepriseId);
    }

    public List<Map<String, Object>> getDerniersMouvementsStock(Integer entrepriseId, int limit) {
        return mouvementStockRepository.findDerniers(entrepriseId, PageRequest.of(0, limit));
    }

    // ─── Paiements ────────────────────────────────────────────────────────────

    public BigDecimal getEncaissementsPeriode(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        return paiementRepository.sumEncaissementsPeriode(entrepriseId, debut, fin);
    }

    public BigDecimal getDecaissementsPeriode(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        return paiementRepository.sumDecaissementsPeriode(entrepriseId, debut, fin);
    }

    public List<Map<String, Object>> getDerniersPaiements(Integer entrepriseId, int limit) {
        return paiementRepository.findDerniersPaiementsClients(entrepriseId, PageRequest.of(0, limit));
    }

    // ─── Entreprise ───────────────────────────────────────────────────────────

    public Object getInfosEntreprise(Integer entrepriseId) {
        return entrepriseRepository.findInfosByEntrepriseId(entrepriseId).orElse(null);
    }

    // ─── Tableau de bord IA ──────────────────────────────────────────────────

    public Map<String, Object> getResumeActivite(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        Map<String, Object> resume = new LinkedHashMap<>();
        resume.put("periodeDebut", debut);
        resume.put("periodeFin", fin);
        resume.put("chiffreAffaires", getCaPeriode(entrepriseId, debut, fin));
        resume.put("achats", getAchatsPeriode(entrepriseId, debut, fin));
        resume.put("encaissements", getEncaissementsPeriode(entrepriseId, debut, fin));
        resume.put("decaissements", getDecaissementsPeriode(entrepriseId, debut, fin));
        resume.put("facturesClientsImpayees", getNombreFacturesClientImpayees(entrepriseId));
        resume.put("facturesFournisseursImpayees", getNombreFacturesFournisseurImpayees(entrepriseId));
        resume.put("commandesClientsEnCours", getCommandesClientEnCours(entrepriseId));
        resume.put("commandesFournisseursEnCours", getCommandesFournisseurEnCours(entrepriseId));
        resume.put("livraisonsEnCours", getLivraisonsEnCours(entrepriseId));
        resume.put("receptionsEnAttente", getReceptionsEnAttente(entrepriseId));
        resume.put("articlesStockFaible", getArticlesStockFaible(entrepriseId));
        return resume;
    }

    // ─── Alertes et urgences ─────────────────────────────────────────────────

    public Map<String, Object> getFacturesEnRetard(Integer entrepriseId, LocalDate aujourdhui, int limit) {
        Map<String, Object> alertes = new LinkedHashMap<>();
        alertes.put("facturesClientsEnRetard",
                factureClientRepository.findFacturesEnRetard(entrepriseId, aujourdhui, PageRequest.of(0, limit)));
        alertes.put("facturesFournisseursEnRetard",
                factureFournisseurRepository.findFacturesEnRetard(entrepriseId, aujourdhui, PageRequest.of(0, limit)));
        return alertes;
    }

    public Map<String, Object> getCommandesEnRetard(Integer entrepriseId, LocalDate aujourdhui, int limit) {
        Map<String, Object> alertes = new LinkedHashMap<>();
        alertes.put("commandesClientsEnRetard",
                bonCommandeClientRepository.findCommandesEnRetard(entrepriseId, aujourdhui, PageRequest.of(0, limit)));
        alertes.put("commandesFournisseursEnRetard",
                bonCommandeFournisseurRepository.findCommandesEnRetard(entrepriseId, aujourdhui, PageRequest.of(0, limit)));
        return alertes;
    }

    public Map<String, Object> getUrgencesAujourdhui(Integer entrepriseId, int limit) {
        LocalDate aujourdhui = LocalDate.now();
        Map<String, Object> urgences = new LinkedHashMap<>();
        urgences.put("dateReference", aujourdhui);
        urgences.putAll(getFacturesEnRetard(entrepriseId, aujourdhui, limit));
        urgences.putAll(getCommandesEnRetard(entrepriseId, aujourdhui, limit));
        urgences.put("devisExpirantDansLes7Jours", devisRepository.findDevisExpirantBientot(
                entrepriseId, aujourdhui, aujourdhui.plusDays(7), PageRequest.of(0, limit)));
        urgences.put("articlesStockFaible", getArticlesStockFaible(entrepriseId));
        return urgences;
    }

    // ─── Recherches ciblées ──────────────────────────────────────────────────

    public Map<String, Object> getDetailFactureClient(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("facture", factureClientRepository.findDetailByNumero(entrepriseId, numero).orElse(null));
        resultat.put("lignes", factureClientRepository.findLignesByNumero(entrepriseId, numero));
        return resultat;
    }

    public Map<String, Object> getDetailDevis(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("devis", devisRepository.findDetailByNumero(entrepriseId, numero).orElse(null));
        resultat.put("lignes", devisRepository.findLignesByNumero(entrepriseId, numero));
        return resultat;
    }

    public Map<String, Object> getDetailFactureFournisseur(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("facture", factureFournisseurRepository.findDetailByNumero(entrepriseId, numero).orElse(null));
        resultat.put("lignes", factureFournisseurRepository.findLignesByNumero(entrepriseId, numero));
        return resultat;
    }

    public Map<String, Object> getDetailLivraison(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("livraison", bonLivraisonRepository.findDetailByNumero(entrepriseId, numero).orElse(null));
        resultat.put("lignes", bonLivraisonRepository.findLignesByNumero(entrepriseId, numero));
        return resultat;
    }

    public Map<String, Object> getDetailReception(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("reception", bonReceptionFournisseurRepository.findDetailByNumero(entrepriseId, numero).orElse(null));
        resultat.put("lignes", bonReceptionFournisseurRepository.findLignesByNumero(entrepriseId, numero));
        return resultat;
    }

    public Object getStockArticle(Integer entrepriseId, String code) {
        return articleRepository.findInfosByCode(entrepriseId, code).orElse(null);
    }

    public List<Map<String, Object>> getFacturesClientParNom(Integer entrepriseId, String client, int limit) {
        List<String> termes = tokenize(client);
        if (termes.isEmpty()) {
            return List.of();
        }

        List<Integer> clientIds = clientRepository.findByEntrepriseIdAndActifTrue(entrepriseId).stream()
                .filter(c -> {
                    List<String> motsNom = tokenize(c.getNom());
                    return termes.stream().allMatch(terme -> motsNom.stream().anyMatch(mot ->
                            mot.equals(terme) || mot.contains(terme) || terme.contains(mot)));
                })
                .map(com.gestion.commerciale.entity.Client::getId)
                .toList();

        if (clientIds.isEmpty()) {
            return List.of();
        }
        return factureClientRepository.findFacturesByClientIds(
                entrepriseId, clientIds, PageRequest.of(0, limit));
    }

    public Map<String, Object> getDetailCommande(Integer entrepriseId, String numero) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        var commandeClient = bonCommandeClientRepository.findDetailByNumero(entrepriseId, numero);
        if (commandeClient.isPresent()) {
            resultat.put("type", "commande_client");
            resultat.put("commande", commandeClient.get());
            resultat.put("lignes", bonCommandeClientRepository.findLignesByNumero(entrepriseId, numero));
            return resultat;
        }

        var commandeFournisseur = bonCommandeFournisseurRepository.findDetailByNumero(entrepriseId, numero);
        if (commandeFournisseur.isPresent()) {
            resultat.put("type", "commande_fournisseur");
            resultat.put("commande", commandeFournisseur.get());
            resultat.put("lignes", bonCommandeFournisseurRepository.findLignesByNumero(entrepriseId, numero));
            return resultat;
        }

        resultat.put("commande", null);
        resultat.put("lignes", List.of());
        return resultat;
    }

    // ─── Comparaisons de périodes ────────────────────────────────────────────

    public Map<String, Object> comparerChiffreAffaires(Integer entrepriseId,
            LocalDate debut1, LocalDate fin1, LocalDate debut2, LocalDate fin2) {
        return buildComparaison(debut1, fin1, getCaPeriode(entrepriseId, debut1, fin1),
                debut2, fin2, getCaPeriode(entrepriseId, debut2, fin2));
    }

    public Map<String, Object> comparerAchats(Integer entrepriseId,
            LocalDate debut1, LocalDate fin1, LocalDate debut2, LocalDate fin2) {
        return buildComparaison(debut1, fin1, getAchatsPeriode(entrepriseId, debut1, fin1),
                debut2, fin2, getAchatsPeriode(entrepriseId, debut2, fin2));
    }

    public Map<String, Object> comparerTresorerie(Integer entrepriseId,
            LocalDate debut1, LocalDate fin1, LocalDate debut2, LocalDate fin2) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("encaissements", buildComparaison(debut1, fin1,
                getEncaissementsPeriode(entrepriseId, debut1, fin1), debut2, fin2,
                getEncaissementsPeriode(entrepriseId, debut2, fin2)));
        resultat.put("decaissements", buildComparaison(debut1, fin1,
                getDecaissementsPeriode(entrepriseId, debut1, fin1), debut2, fin2,
                getDecaissementsPeriode(entrepriseId, debut2, fin2)));
        return resultat;
    }

    public BigDecimal getMargePeriode(Integer entrepriseId, LocalDate debut, LocalDate fin) {
        return factureClientRepository.sumMargePeriode(entrepriseId, debut, fin);
    }

    public List<Map<String, Object>> getAffairesPlusRentables(Integer entrepriseId, int limit) {
        return factureClientRepository.findAffairesParMarge(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getArticlesMeilleureMarge(Integer entrepriseId, int limit) {
        return factureClientRepository.findArticlesParMarge(entrepriseId, PageRequest.of(0, limit));
    }

    public List<Map<String, Object>> getClientsMeilleureMarge(Integer entrepriseId, int limit) {
        return factureClientRepository.findClientsParMarge(entrepriseId, PageRequest.of(0, limit));
    }

    public Map<String, Object> comparerMarge(Integer entrepriseId,
            LocalDate debut1, LocalDate fin1, LocalDate debut2, LocalDate fin2) {
        return buildComparaison(debut1, fin1, getMargePeriode(entrepriseId, debut1, fin1),
                debut2, fin2, getMargePeriode(entrepriseId, debut2, fin2));
    }

    public Map<String, Object> getTauxAcceptationDevis(Integer entrepriseId) {
        return conversionResult(devisRepository.countAcceptes(entrepriseId), devisRepository.countSoumis(entrepriseId));
    }

    public long getNombreDevisRefuses(Integer entrepriseId) {
        return devisRepository.countRefuses(entrepriseId);
    }

    public List<Map<String, Object>> getClientsPlusDevisAcceptes(Integer entrepriseId, int limit) {
        return devisRepository.findClientsAvecPlusDeDevisAcceptes(entrepriseId, PageRequest.of(0, limit));
    }

    public Map<String, Object> comparerTauxConversion(Integer entrepriseId,
            LocalDate debut1, LocalDate fin1, LocalDate debut2, LocalDate fin2) {
        Map<String, Object> periode1 = conversionResult(
                devisRepository.countAcceptesPeriode(entrepriseId, debut1, fin1),
                devisRepository.countSoumisPeriode(entrepriseId, debut1, fin1));
        Map<String, Object> periode2 = conversionResult(
                devisRepository.countAcceptesPeriode(entrepriseId, debut2, fin2),
                devisRepository.countSoumisPeriode(entrepriseId, debut2, fin2));
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("periode1", Map.of("debut", debut1, "fin", fin1, "donnees", periode1));
        resultat.put("periode2", Map.of("debut", debut2, "fin", fin2, "donnees", periode2));
        resultat.put("ecartPoints", ((BigDecimal) periode2.get("tauxPourcentage"))
                .subtract((BigDecimal) periode1.get("tauxPourcentage")));
        return resultat;
    }

    private Map<String, Object> conversionResult(long acceptes, long soumis) {
        BigDecimal taux = soumis == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(acceptes)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(soumis), 2, RoundingMode.HALF_UP);
        return Map.of("devisAcceptes", acceptes, "devisSoumis", soumis, "tauxPourcentage", taux);
    }

    private Map<String, Object> buildComparaison(LocalDate debut1, LocalDate fin1, BigDecimal valeur1,
            LocalDate debut2, LocalDate fin2, BigDecimal valeur2) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("periode1", Map.of("debut", debut1, "fin", fin1, "montant", valeur1));
        resultat.put("periode2", Map.of("debut", debut2, "fin", fin2, "montant", valeur2));
        BigDecimal ecart = valeur2.subtract(valeur1);
        resultat.put("ecart", ecart);
        resultat.put("evolutionPourcentage", valeur1.signum() == 0 ? null
                : ecart.multiply(BigDecimal.valueOf(100)).divide(valeur1, 2, RoundingMode.HALF_UP));
        return resultat;
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
        return normalized.isEmpty() ? List.of() : Arrays.asList(normalized.split("\\s+"));
    }
}
