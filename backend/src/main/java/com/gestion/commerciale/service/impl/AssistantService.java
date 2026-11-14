package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.assistant.ChatResponseDTO;
import com.gestion.commerciale.dto.assistant.ChatActionDTO;
import com.gestion.commerciale.dto.assistant.ChatChartDTO;
import com.gestion.commerciale.dto.assistant.ChatChartDatasetDTO;
import com.gestion.commerciale.dto.assistant.IntentResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final IntentClassifierService intentClassifierService;
    private final AssistantDataService assistantDataService;
    private final OpenAiClientService openAiClientService;
    private final ConversationMemoryService conversationMemoryService;

    private static final String REFORMULATION_PROMPT = """
        Tu es un assistant pour une application de gestion commerciale marocaine.
        On te donne des donnees reelles ci-dessous. Reponds a la question de l'utilisateur
        UNIQUEMENT en te basant sur ces donnees, en francais, de maniere claire et concise.

        IMPORTANT :
        - Tous les montants monetaires sont exprimes en dirhams marocains (DH), jamais en euros ni en dollars.
          Affiche toujours le suffixe "DH" apres chaque montant (ex: 21 600 DH).
        - N'invente jamais de chiffre qui n'est pas dans les donnees fournies.
        - Si une note explicative accompagne les donnees, fais-en confiance et reponds directement
          sans demander d'informations supplementaires non pertinentes, et sans recalculer ou
          reinterpreter toi-meme les comparaisons deja faites en base de donnees.
        - Si les donnees sont vides, dis-le clairement.
        """;

    private static final String GENERAL_PROMPT = """
        Tu es l'assistant integre a une application de gestion commerciale
        (clients, fournisseurs, devis, commandes, livraisons, factures, paiements, articles, affaires).
        Reponds normalement et brievement a la question ou au message de l'utilisateur,
        comme un assistant IA classique, en francais.
        Si la question porte en realite sur des donnees precises de l'entreprise
        (montants, listes de clients, chiffres exacts), precise que tu n'as pas acces
        a ces donnees dans ce mode et invite l'utilisateur a reformuler.
        Si un historique recent est fourni, utilise-le pour comprendre le contexte mais reponds uniquement
        au NOUVEAU message, sans repeter toute la conversation.
        """;

    public ChatResponseDTO chat(String userMessage, Integer entrepriseId, Integer utilisateurId) {
        String history = conversationMemoryService.getHistory(utilisateurId, entrepriseId);
        IntentResultDTO intentResult = intentClassifierService.classify(userMessage, history);
        String intent = intentResult.getIntent();

        if ("general".equals(intent)) {
            String messageWithHistory = history.isBlank() ? userMessage
                    : "Historique recent :\n" + history + "\n\nNOUVEAU message : " + userMessage;
            String reply = openAiClientService.call(GENERAL_PROMPT, messageWithHistory);
            ChatResponseDTO response = ChatResponseDTO.builder()
                    .reply(reply)
                    .intent(intent)
                    .actions(List.of())
                    .build();
            conversationMemoryService.addExchange(utilisateurId, entrepriseId, userMessage, reply);
            return response;
        }

        Object data = fetchData(intent, intentResult.getParams(), entrepriseId);
        String contextForLlm = buildContext(intent, userMessage, data);
        String reply = openAiClientService.call(REFORMULATION_PROMPT, contextForLlm);

        ChatResponseDTO response = ChatResponseDTO.builder()
                .reply(reply)
                .intent(intent)
                .actions(buildActions(intent))
                .chart(buildChart(intent, data))
                .build();
        conversationMemoryService.addExchange(utilisateurId, entrepriseId, userMessage, reply);
        return response;
    }

    public void clearHistory(Integer entrepriseId, Integer utilisateurId) {
        conversationMemoryService.clear(utilisateurId, entrepriseId);
    }

    private List<ChatActionDTO> buildActions(String intent) {
        return switch (intent) {
            case "clients_impayes", "meilleur_client", "nombre_clients", "liste_clients",
                 "factures_par_client" -> List.of(action("Voir les clients", "/clients", "bi-people"),
                                                   action("Voir les factures", "/vente/factures", "bi-receipt"));
            case "nombre_devis", "devis_en_attente", "devis_expires", "montant_devis_acceptes",
                 "detail_devis", "taux_acceptation_devis", "nombre_devis_refuses",
                 "client_plus_devis_acceptes", "comparaison_taux_conversion" ->
                    List.of(action("Ouvrir les devis", "/vente/devis", "bi-file-earmark-text"));
            case "affaires_actives", "liste_affaires", "affaires_inactives" ->
                    List.of(action("Voir les affaires", "/affaires", "bi-briefcase"));
            case "nombre_articles", "liste_articles", "stock_article", "articles_stock_faible",
                 "derniers_mouvements_stock" -> List.of(action("Voir les articles", "/articles", "bi-box-seam"),
                                                         action("Ouvrir le stock", "/stock", "bi-archive"));
            case "nombre_familles", "liste_familles" ->
                    List.of(action("Voir les articles", "/articles", "bi-box-seam"));
            case "nombre_fournisseurs", "liste_fournisseurs", "fournisseurs_a_payer",
                 "meilleur_fournisseur" -> List.of(action("Voir les fournisseurs", "/fournisseurs", "bi-building"),
                                                    action("Voir les factures", "/achat/factures", "bi-file-earmark-check"));
            case "commandes_client_en_cours", "dernieres_commandes_client" ->
                    List.of(action("Commandes clients", "/vente/commandes", "bi-cart-check"));
            case "commandes_fournisseur_en_cours", "dernieres_commandes_fournisseur" ->
                    List.of(action("Commandes fournisseurs", "/achat/commandes", "bi-bag-check"));
            case "detail_commande", "commandes_en_retard" -> List.of(
                    action("Commandes clients", "/vente/commandes", "bi-cart-check"),
                    action("Commandes fournisseurs", "/achat/commandes", "bi-bag-check"));
            case "livraisons_en_cours", "dernieres_livraisons", "detail_livraison" ->
                    List.of(action("Voir les livraisons", "/vente/livraisons", "bi-truck"));
            case "receptions_en_attente", "dernieres_receptions", "detail_reception" ->
                    List.of(action("Voir les réceptions", "/achat/receptions", "bi-box-arrow-in-down"));
            case "detail_facture_client", "dernieres_factures_client", "nombre_factures_client_impayees" ->
                    List.of(action("Factures clients", "/vente/factures", "bi-receipt"));
            case "dernieres_factures_fournisseur", "nombre_factures_fournisseur_impayees",
                 "detail_facture_fournisseur" ->
                    List.of(action("Factures fournisseurs", "/achat/factures", "bi-file-earmark-check"));
            case "factures_en_retard" -> List.of(
                    action("Factures clients", "/vente/factures", "bi-receipt"),
                    action("Factures fournisseurs", "/achat/factures", "bi-file-earmark-check"));
            case "urgences_aujourdhui", "resume_activite", "ca_periode", "achats_periode",
                 "encaissements_periode", "decaissements_periode", "comparaison_ca",
                 "comparaison_achats", "comparaison_tresorerie" ->
                    List.of(action("Ouvrir le tableau de bord", "/dashboard", "bi-speedometer2"));
            case "marge_periode", "affaires_plus_rentables", "articles_meilleure_marge",
                 "clients_meilleure_marge", "comparaison_marge" ->
                    List.of(action("Ouvrir le tableau de bord", "/dashboard", "bi-speedometer2"));
            case "derniers_paiements" ->
                    List.of(action("Factures clients", "/vente/factures", "bi-receipt"));
            case "infos_entreprise" ->
                    List.of(action("Paramètres entreprise", "/parametres/entreprise", "bi-gear"));
            default -> List.of();
        };
    }

    private ChatActionDTO action(String label, String path, String icon) {
        return ChatActionDTO.builder().label(label).path(path).icon(icon).build();
    }

    private ChatChartDTO buildChart(String intent, Object data) {
        if (!(data instanceof Map<?, ?> map)) {
            return null;
        }

        return switch (intent) {
            case "comparaison_ca" -> comparisonChart("Comparaison du chiffre d'affaires", map,
                    "Chiffre d'affaires", "#1A6FE8");
            case "comparaison_achats" -> comparisonChart("Comparaison des achats", map,
                    "Achats", "#F59E0B");
            case "comparaison_marge" -> comparisonChart("Comparaison de la marge", map,
                    "Marge", "#1A6FE8");
            case "comparaison_taux_conversion" -> conversionChart(map);
            case "comparaison_tresorerie" -> treasuryChart(map);
            case "resume_activite" -> activitySummaryChart(map);
            default -> null;
        };
    }

    private ChatChartDTO comparisonChart(String title, Map<?, ?> comparison,
                                          String datasetLabel, String color) {
        Map<?, ?> period1 = asMap(comparison.get("periode1"));
        Map<?, ?> period2 = asMap(comparison.get("periode2"));
        return ChatChartDTO.builder()
                .type("bar")
                .title(title)
                .unit("DH")
                .labels(List.of(periodLabel(period1), periodLabel(period2)))
                .datasets(List.of(dataset(datasetLabel, color,
                        amount(period1.get("montant")), amount(period2.get("montant")))))
                .build();
    }

    private ChatChartDTO treasuryChart(Map<?, ?> data) {
        Map<?, ?> receipts = asMap(data.get("encaissements"));
        Map<?, ?> payments = asMap(data.get("decaissements"));
        Map<?, ?> period1 = asMap(receipts.get("periode1"));
        Map<?, ?> period2 = asMap(receipts.get("periode2"));
        Map<?, ?> paymentPeriod1 = asMap(payments.get("periode1"));
        Map<?, ?> paymentPeriod2 = asMap(payments.get("periode2"));
        return ChatChartDTO.builder()
                .type("bar")
                .title("Comparaison de trésorerie")
                .unit("DH")
                .labels(List.of(periodLabel(period1), periodLabel(period2)))
                .datasets(List.of(
                        dataset("Encaissements", "#1A6FE8", amount(period1.get("montant")), amount(period2.get("montant"))),
                        dataset("Décaissements", "#F59E0B", amount(paymentPeriod1.get("montant")), amount(paymentPeriod2.get("montant")))))
                .build();
    }

    private ChatChartDTO activitySummaryChart(Map<?, ?> data) {
        return ChatChartDTO.builder()
                .type("bar")
                .title("Synthèse financière de la période")
                .unit("DH")
                .labels(List.of("CA", "Achats", "Encaissements", "Décaissements"))
                .datasets(List.of(dataset("Montant", "#1A6FE8",
                        amount(data.get("chiffreAffaires")), amount(data.get("achats")),
                        amount(data.get("encaissements")), amount(data.get("decaissements")))))
                .build();
    }

    private ChatChartDTO conversionChart(Map<?, ?> data) {
        Map<?, ?> period1 = asMap(data.get("periode1"));
        Map<?, ?> period2 = asMap(data.get("periode2"));
        Map<?, ?> values1 = asMap(period1.get("donnees"));
        Map<?, ?> values2 = asMap(period2.get("donnees"));
        return ChatChartDTO.builder()
                .type("bar").title("Comparaison du taux d'acceptation").unit("%")
                .labels(List.of(periodLabel(period1), periodLabel(period2)))
                .datasets(List.of(dataset("Taux d'acceptation", "#1A6FE8",
                        amount(values1.get("tauxPourcentage")), amount(values2.get("tauxPourcentage")))))
                .build();
    }

    private ChatChartDatasetDTO dataset(String label, String color, BigDecimal... values) {
        return ChatChartDatasetDTO.builder().label(label).color(color).values(List.of(values)).build();
    }

    private Map<?, ?> asMap(Object value) {
        return value instanceof Map<?, ?> map ? map : Map.of();
    }

    private BigDecimal amount(Object value) {
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString());
    }

    private String periodLabel(Map<?, ?> period) {
        return period.get("debut") + " → " + period.get("fin");
    }

    // ─── Construction du contexte envoyé au LLM ──────────────────────────────

    private String buildContext(String intent, String userMessage, Object data) {
        String note = switch (intent) {
            case "devis_expires" -> "Note : ces devis sont deja filtres en base de donnees car leur date " +
                    "de validite est deja depassee. Affirme directement qu'ils sont expires, sans comparer " +
                    "les dates toi-meme.\n";
            case "devis_en_attente" -> "Note : ces devis ont le statut 'envoye', en attente de reponse du client.\n";
            case "montant_devis_acceptes" -> "Note : montant global de revenu potentiel (devis acceptes), " +
                    "pas un benefice net. Reponds directement sans demander de details sur les couts.\n";
            case "ca_periode" -> "Note : chiffre d'affaires (ventes facturees et payees) sur la periode. " +
                    "Reponds directement.\n";
            case "achats_periode" -> "Note : total des achats (factures fournisseur facturees et payees) " +
                    "sur la periode. Reponds directement.\n";
            case "articles_stock_faible" -> "Note : ces articles ont deja ete identifies en base comme etant " +
                    "en stock bas ou en rupture (stock actuel <= seuil d'alerte). Ne recalcule rien, annonce " +
                    "directement qu'ils sont en stock bas/rupture, en citant stock actuel et seuil.\n";
            case "nombre_articles" -> "Note : nombre d'articles actifs references dans le catalogue/stock.\n";
            case "meilleur_client" -> "Note : liste deja triee par montant total facture et paye, du plus " +
                    "eleve au plus faible. Le premier de la liste est le client le plus important.\n";
            case "meilleur_fournisseur" -> "Note : liste deja triee par montant total d'achats payes a ce " +
                    "fournisseur, du plus eleve au plus faible. Le premier est le fournisseur le plus important " +
                    "(plus gros volume d'achats).\n";
            case "fournisseurs_a_payer" -> "Note : ce sont les fournisseurs auxquels l'ENTREPRISE DOIT de " +
                    "l'argent (factures fournisseur non payees), pas l'inverse. Precise bien que c'est " +
                    "l'entreprise qui doit payer ces fournisseurs.\n";
            case "commandes_fournisseur_en_cours" -> "Note : la donnee contient 'nombre' (nombre de commandes) " +
                    "et 'montantTotal' (montant total en DH) des commandes fournisseur en cours.\n";
            case "derniers_paiements" -> "Note : liste deja triee du paiement le plus recent au plus ancien.\n";
            case "dernieres_commandes_client", "dernieres_commandes_fournisseur", "dernieres_livraisons",
                 "dernieres_receptions", "dernieres_factures_client", "dernieres_factures_fournisseur",
                 "derniers_mouvements_stock" -> "Note : liste deja triee de l'element le plus recent au plus ancien.\n";
            case "nombre_factures_client_impayees" -> "Note : nombre de factures que les clients doivent encore payer a l'entreprise.\n";
            case "nombre_factures_fournisseur_impayees" -> "Note : nombre de factures que l'entreprise doit encore payer aux fournisseurs.\n";
            case "encaissements_periode" -> "Note : total des paiements RECUS des clients sur la periode " +
                    "(argent entrant). Reponds directement.\n";
            case "decaissements_periode" -> "Note : total des paiements VERSES aux fournisseurs sur la periode " +
                    "(argent sortant). Reponds directement.\n";
            case "infos_entreprise" -> "Note : ce sont les informations administratives de l'entreprise " +
                    "de l'utilisateur (pas d'un client ou fournisseur).\n";
            case "resume_activite" -> "Note : presente une synthese structuree de la periode indiquee. " +
                    "Distingue clairement chiffre d'affaires, achats, encaissements et decaissements. " +
                    "Les nombres d'impayes et les elements en cours sont des situations actuelles, tandis que " +
                    "les quatre montants sont calcules sur la periode. Signale les alertes de stock sans inventer.\n";
            case "urgences_aujourdhui" -> "Note : toutes les alertes ont deja ete filtrees selon la date de " +
                    "reference. Classe la reponse par priorite : factures echues, commandes en retard, devis " +
                    "expirant bientot, puis stock faible. Si toutes les listes sont vides, indique qu'aucune " +
                    "urgence n'a ete detectee.\n";
            case "factures_en_retard" -> "Note : les factures listees sont impayees et leur echeance est " +
                    "strictement depassee. Pour les factures clients, le client doit payer l'entreprise. Pour " +
                    "les factures fournisseurs, l'entreprise doit payer le fournisseur.\n";
            case "commandes_en_retard" -> "Note : les commandes listees sont toujours en cours et leur date " +
                    "de livraison prevue est strictement depassee. Les commandes clients doivent etre livrees " +
                    "par l'entreprise ; les commandes fournisseurs doivent etre recues du fournisseur.\n";
            case "detail_facture_client", "stock_article", "factures_par_client", "detail_commande" ->
                    "Note : la recherche est limitee aux donnees de l'entreprise connectee. Si le resultat est " +
                    "nul ou vide, indique clairement qu'aucun element correspondant n'a ete trouve.\n";
            case "comparaison_ca", "comparaison_achats", "comparaison_tresorerie" ->
                    "Note : periode1 est la periode de reference et periode2 la periode comparee. L'ecart est " +
                    "calcule ainsi : periode2 - periode1. Un pourcentage positif indique une hausse, un negatif " +
                    "une baisse. Si le pourcentage est nul dans les donnees, il est non calculable car la valeur " +
                    "de reference est egale a zero. Ne recalcule pas les valeurs.\n";
            case "marge_periode", "affaires_plus_rentables", "articles_meilleure_marge",
                 "clients_meilleure_marge", "comparaison_marge" ->
                    "Note : la marge est calculee sur les lignes des factures clients payees : quantite x " +
                    "(prix de vente facture - prix d'achat actuel de l'article). Il s'agit d'une marge " +
                    "commerciale estimee, pas du benefice net de l'entreprise.\n";
            case "taux_acceptation_devis", "client_plus_devis_acceptes", "comparaison_taux_conversion" ->
                    "Note : le taux d'acceptation est le nombre de devis acceptes divise par le nombre de " +
                    "devis non brouillons, multiplie par 100.\n";
            case "detail_devis", "detail_facture_fournisseur", "detail_livraison", "detail_reception" ->
                    "Note : presente les informations du document et ses lignes. Si le document est nul, " +
                    "indique clairement qu'aucun document correspondant n'a ete trouve.\n";
case "liste_clients" -> "Note : ceci est la liste des NOMS DES CLIENTS (personnes/entreprises), pas des affaires/projets.\n";
case "liste_affaires" -> "Note : ceci est la liste des NOMS DES AFFAIRES/PROJETS, pas des clients.\n";
            case "affaires_inactives" -> "Note : ceci est la liste des noms des affaires/projets actuel lement inactifs (clotures ou termines).\n";
            default -> "";
        };
        return "Question : " + userMessage + "\n" + note + "Données réelles : " + formatData(data);
    }

    private String formatData(Object data) {
        if (data instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP).toPlainString();
        }

        if (data instanceof List<?> list) {
            if (list.isEmpty()) {
                return "aucune donnée";
            }
            if (list.get(0) instanceof Map) {
                StringBuilder sb = new StringBuilder();
                for (Object item : list) {
                    Map<?, ?> m = (Map<?, ?>) item;
                    if (m.containsKey("stock") && m.containsKey("seuilAlerte")) {
                        sb.append("- ").append(m.get("code")).append(" (")
                          .append(m.get("designation")).append(") : stock actuel = ")
                          .append(m.get("stock")).append(", seuil d'alerte = ")
                          .append(m.get("seuilAlerte")).append(" → STOCK BAS / RUPTURE\n");
                    } else {
                        sb.append("- ").append(m).append("\n");
                    }
                }
                return sb.toString();
            }
        }

        return String.valueOf(data);
    }

    // ─── Récupération des données selon l'intention ──────────────────────────

    private Object fetchData(String intent, Map<String, Object> params, Integer entrepriseId) {
        return switch (intent) {

            // Clients / Ventes
            case "clients_impayes" -> {
                int limit = intOrDefault(params, "limit", 5);
                yield assistantDataService.getClientsImpayes(entrepriseId, limit);
            }
            case "ca_periode" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getCaPeriode(entrepriseId, periode[0], periode[1]);
            }
            case "meilleur_client" -> {
                int limit = intOrDefault(params, "limit", 3);
                yield assistantDataService.getMeilleursClients(entrepriseId, limit);
            }
            case "nombre_clients" -> assistantDataService.getNombreClients(entrepriseId);
            case "liste_clients" -> {
    int limit = intOrDefault(params, "limit", 10);
    yield assistantDataService.getListeClients(entrepriseId, limit);
}

            // Devis
            case "nombre_devis" -> assistantDataService.getNombreDevis(entrepriseId);
            case "devis_en_attente" -> {
                int limit = intOrDefault(params, "limit", 5);
                yield assistantDataService.getDevisEnAttente(entrepriseId, limit);
            }
            case "devis_expires" -> {
                int limit = intOrDefault(params, "limit", 5);
                yield assistantDataService.getDevisExpires(entrepriseId, limit);
            }
            case "montant_devis_acceptes" -> assistantDataService.getMontantDevisAcceptes(entrepriseId);
            case "detail_devis" -> assistantDataService.getDetailDevis(
                    entrepriseId, requiredString(params, "numero"));
            case "taux_acceptation_devis" -> assistantDataService.getTauxAcceptationDevis(entrepriseId);
            case "nombre_devis_refuses" -> assistantDataService.getNombreDevisRefuses(entrepriseId);
            case "client_plus_devis_acceptes" -> assistantDataService.getClientsPlusDevisAcceptes(
                    entrepriseId, intOrDefault(params, "limit", 3));

            // Affaires
            case "affaires_actives" -> assistantDataService.getAffairesActives(entrepriseId);
            case "liste_affaires" -> {
    int limit = intOrDefault(params, "limit", 10);
    yield assistantDataService.getListeAffaires(entrepriseId, limit);
    
}
           case "affaires_inactives" -> {
    int limit = intOrDefault(params, "limit", 10);
    yield assistantDataService.getAffairesInactives(entrepriseId, limit);
}
            // Articles / Stock
            case "nombre_articles" -> assistantDataService.getNombreArticles(entrepriseId);
            case "articles_stock_faible" -> assistantDataService.getArticlesStockFaible(entrepriseId);
            case "liste_articles" -> assistantDataService.getListeArticles(entrepriseId, intOrDefault(params, "limit", 10));
            case "nombre_familles" -> assistantDataService.getNombreFamilles(entrepriseId);
            case "liste_familles" -> assistantDataService.getListeFamilles(entrepriseId, intOrDefault(params, "limit", 10));

            // Fournisseurs / Achats
            case "nombre_fournisseurs" -> assistantDataService.getNombreFournisseurs(entrepriseId);
            case "fournisseurs_a_payer" -> {
                int limit = intOrDefault(params, "limit", 5);
                yield assistantDataService.getFournisseursAPayer(entrepriseId, limit);
            }
            case "meilleur_fournisseur" -> {
                int limit = intOrDefault(params, "limit", 3);
                yield assistantDataService.getMeilleursFournisseurs(entrepriseId, limit);
            }
            case "achats_periode" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getAchatsPeriode(entrepriseId, periode[0], periode[1]);
            }
            case "liste_fournisseurs" -> assistantDataService.getListeFournisseurs(
                    entrepriseId, intOrDefault(params, "limit", 10));

            // Commandes / Livraisons / Réceptions
            case "commandes_client_en_cours" -> assistantDataService.getCommandesClientEnCours(entrepriseId);
            case "commandes_fournisseur_en_cours" -> assistantDataService.getCommandesFournisseurEnCours(entrepriseId);
            case "livraisons_en_cours" -> assistantDataService.getLivraisonsEnCours(entrepriseId);
            case "receptions_en_attente" -> assistantDataService.getReceptionsEnAttente(entrepriseId);
            case "dernieres_commandes_client" -> assistantDataService.getDernieresCommandesClient(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "dernieres_commandes_fournisseur" -> assistantDataService.getDernieresCommandesFournisseur(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "dernieres_livraisons" -> assistantDataService.getDernieresLivraisons(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "dernieres_receptions" -> assistantDataService.getDernieresReceptions(
                    entrepriseId, intOrDefault(params, "limit", 5));

            // Factures
            case "dernieres_factures_client" -> assistantDataService.getDernieresFacturesClient(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "nombre_factures_client_impayees" -> assistantDataService.getNombreFacturesClientImpayees(entrepriseId);
            case "dernieres_factures_fournisseur" -> assistantDataService.getDernieresFacturesFournisseur(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "nombre_factures_fournisseur_impayees" -> assistantDataService.getNombreFacturesFournisseurImpayees(entrepriseId);
            case "detail_facture_fournisseur" -> assistantDataService.getDetailFactureFournisseur(
                    entrepriseId, requiredString(params, "numero"));
            case "detail_livraison" -> assistantDataService.getDetailLivraison(
                    entrepriseId, requiredString(params, "numero"));
            case "detail_reception" -> assistantDataService.getDetailReception(
                    entrepriseId, requiredString(params, "numero"));

            // Paiements
            case "encaissements_periode" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getEncaissementsPeriode(entrepriseId, periode[0], periode[1]);
            }
            case "decaissements_periode" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getDecaissementsPeriode(entrepriseId, periode[0], periode[1]);
            }
            case "derniers_paiements" -> {
                int limit = intOrDefault(params, "limit", 5);
                yield assistantDataService.getDerniersPaiements(entrepriseId, limit);
            }

            // Mouvements de stock
            case "derniers_mouvements_stock" -> assistantDataService.getDerniersMouvementsStock(
                    entrepriseId, intOrDefault(params, "limit", 10));

            // Entreprise
            case "infos_entreprise" -> assistantDataService.getInfosEntreprise(entrepriseId);

            // Tableau de bord / Synthèse
            case "resume_activite" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getResumeActivite(entrepriseId, periode[0], periode[1]);
            }

            // Alertes / Urgences
            case "urgences_aujourdhui" -> assistantDataService.getUrgencesAujourdhui(
                    entrepriseId, intOrDefault(params, "limit", 10));
            case "factures_en_retard" -> assistantDataService.getFacturesEnRetard(
                    entrepriseId, LocalDate.now(), intOrDefault(params, "limit", 10));
            case "commandes_en_retard" -> assistantDataService.getCommandesEnRetard(
                    entrepriseId, LocalDate.now(), intOrDefault(params, "limit", 10));

            // Recherche ciblée
            case "detail_facture_client" -> assistantDataService.getDetailFactureClient(
                    entrepriseId, requiredString(params, "numero"));
            case "stock_article" -> assistantDataService.getStockArticle(
                    entrepriseId, requiredString(params, "code"));
            case "factures_par_client" -> assistantDataService.getFacturesClientParNom(
                    entrepriseId, requiredString(params, "client"), intOrDefault(params, "limit", 10));
            case "detail_commande" -> assistantDataService.getDetailCommande(
                    entrepriseId, requiredString(params, "numero"));

            // Comparaisons de périodes
            case "comparaison_ca" -> {
                LocalDate[] p = resolveComparaison(params);
                yield assistantDataService.comparerChiffreAffaires(entrepriseId, p[0], p[1], p[2], p[3]);
            }
            case "comparaison_achats" -> {
                LocalDate[] p = resolveComparaison(params);
                yield assistantDataService.comparerAchats(entrepriseId, p[0], p[1], p[2], p[3]);
            }
            case "comparaison_tresorerie" -> {
                LocalDate[] p = resolveComparaison(params);
                yield assistantDataService.comparerTresorerie(entrepriseId, p[0], p[1], p[2], p[3]);
            }
            case "marge_periode" -> {
                LocalDate[] periode = resolvePeriode(params);
                yield assistantDataService.getMargePeriode(entrepriseId, periode[0], periode[1]);
            }
            case "affaires_plus_rentables" -> assistantDataService.getAffairesPlusRentables(
                    entrepriseId, intOrDefault(params, "limit", 3));
            case "articles_meilleure_marge" -> assistantDataService.getArticlesMeilleureMarge(
                    entrepriseId, intOrDefault(params, "limit", 5));
            case "clients_meilleure_marge" -> assistantDataService.getClientsMeilleureMarge(
                    entrepriseId, intOrDefault(params, "limit", 3));
            case "comparaison_marge" -> {
                LocalDate[] p = resolveComparaison(params);
                yield assistantDataService.comparerMarge(entrepriseId, p[0], p[1], p[2], p[3]);
            }
            case "comparaison_taux_conversion" -> {
                LocalDate[] p = resolveComparaison(params);
                yield assistantDataService.comparerTauxConversion(entrepriseId, p[0], p[1], p[2], p[3]);
            }

            default -> null;
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private int intOrDefault(Map<String, Object> params, String key, int defaultValue) {
        try {
            int value = params.containsKey(key) ? Integer.parseInt(params.get(key).toString()) : defaultValue;
            return Math.max(1, Math.min(value, 50));
        } catch (Exception ignored) {
            return defaultValue;
        }
    }

    private String requiredString(Map<String, Object> params, String key) {
        Object value = params.get(key);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException("Le parametre '" + key + "' est obligatoire");
        }
        return value.toString().trim();
    }

    private LocalDate[] resolvePeriode(Map<String, Object> params) {
        LocalDate debut = dateOrDefault(params, "debut", YearMonth.now().atDay(1));
        LocalDate fin = dateOrDefault(params, "fin", YearMonth.now().atEndOfMonth());
        if (debut.isAfter(fin)) {
            LocalDate temporary = debut;
            debut = fin;
            fin = temporary;
        }
        return new LocalDate[]{debut, fin};
    }

    private LocalDate[] resolveComparaison(Map<String, Object> params) {
        YearMonth moisCourant = YearMonth.now();
        YearMonth moisPrecedent = moisCourant.minusMonths(1);
        LocalDate debut1 = dateOrDefault(params, "debut1", moisPrecedent.atDay(1));
        LocalDate fin1 = dateOrDefault(params, "fin1", moisPrecedent.atEndOfMonth());
        LocalDate debut2 = dateOrDefault(params, "debut2", moisCourant.atDay(1));
        LocalDate fin2 = dateOrDefault(params, "fin2", moisCourant.atEndOfMonth());
        if (debut1.isAfter(fin1)) {
            LocalDate temporary = debut1; debut1 = fin1; fin1 = temporary;
        }
        if (debut2.isAfter(fin2)) {
            LocalDate temporary = debut2; debut2 = fin2; fin2 = temporary;
        }
        return new LocalDate[]{debut1, fin1, debut2, fin2};
    }

    private LocalDate dateOrDefault(Map<String, Object> params, String key, LocalDate defaultValue) {
        Object value = params.get(key);
        if (value == null || value.toString().isBlank()) {
            return defaultValue;
        }
        try {
            return LocalDate.parse(value.toString().trim());
        } catch (Exception ignored) {
            return defaultValue;
        }
    }
}
