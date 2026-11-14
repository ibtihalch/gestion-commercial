package com.gestion.commerciale.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.commerciale.dto.assistant.IntentResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IntentClassifierService {

    private final OpenAiClientService openAiClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

private static final String SYSTEM_PROMPT = """
    Tu es un classifieur d'intentions pour un assistant de gestion commerciale.
    Analyse la question de l'utilisateur et réponds UNIQUEMENT avec un JSON valide,
    sans aucun texte avant ou après, au format exact :
    {"intent": "NOM_INTENTION", "params": {"cle": "valeur"}}

    Intentions disponibles :

    -- Clients / Ventes --
    - clients_impayes : clients qui doivent de l'argent a l'entreprise (params: limit, defaut 5)
    - ca_periode : chiffre d'affaires (ventes payees) sur une periode (params: debut, fin au format YYYY-MM-DD ; si non precise, mois en cours)
    - meilleur_client : client generant le plus de chiffre d'affaires (params: limit, defaut 3)
    - nombre_clients : nombre de clients actifs enregistres
    - liste_clients : liste des noms des clients actifs (params: limit, defaut 10)
    -- Devis --
    - nombre_devis : nombre total de devis
    - devis_en_attente : devis envoyes en attente de reponse (params: limit, defaut 5)
    - devis_expires : devis dont la date de validite est depassee (params: limit, defaut 5)
    - montant_devis_acceptes : montant total des devis acceptes
    - detail_devis : detail complet d'un devis par numero (params: numero obligatoire)
    - taux_acceptation_devis : taux global de devis acceptes parmi les devis non brouillons
    - nombre_devis_refuses : nombre total de devis refuses
    - client_plus_devis_acceptes : clients ayant le plus de devis acceptes (params: limit, defaut 3)
    -- Affaires --
    - affaires_actives : nombre d'affaires/projets actifs en cours
    - liste_affaires : liste des noms des affaires/projets actifs (params: limit, defaut 10)
    - affaires_inactives : liste des noms des affaires/projets inactifs/clotures/termines (params: limit, defaut 10)

    -- Articles / Stock --
    - nombre_articles : nombre d'articles actifs en catalogue/stock
    - articles_stock_faible : articles en rupture ou proche du seuil d'alerte
    - liste_articles : liste des articles actifs avec code, stock et prix de vente (params: limit, defaut 10)
    - nombre_familles : nombre de familles d'articles actives
    - liste_familles : liste des familles d'articles actives (params: limit, defaut 10)

    -- Fournisseurs / Achats --
    - nombre_fournisseurs : nombre de fournisseurs actifs
    - fournisseurs_a_payer : fournisseurs auxquels l'entreprise doit encore de l'argent (params: limit, defaut 5)
    - meilleur_fournisseur : fournisseur avec le plus gros volume d'achats payes (params: limit, defaut 3)
    - achats_periode : total des achats (factures fournisseur payees) sur une periode (params: debut, fin au format YYYY-MM-DD ; si non precise, mois en cours)
    - liste_fournisseurs : liste des noms des fournisseurs actifs (params: limit, defaut 10)

    -- Commandes / Livraisons / Réceptions --
    - commandes_client_en_cours : nombre de commandes client en cours (pas encore livrees)
    - commandes_fournisseur_en_cours : nombre et montant des commandes fournisseur en cours
    - livraisons_en_cours : nombre de livraisons client en cours
    - receptions_en_attente : nombre de receptions fournisseur en cours/en attente
    - dernieres_commandes_client : dernieres commandes clients, tous statuts (params: limit, defaut 5)
    - dernieres_commandes_fournisseur : dernieres commandes fournisseurs, tous statuts (params: limit, defaut 5)
    - dernieres_livraisons : derniers bons de livraison, tous statuts (params: limit, defaut 5)
    - dernieres_receptions : derniers bons de reception fournisseur, tous statuts (params: limit, defaut 5)

    -- Factures --
    - dernieres_factures_client : dernieres factures envoyees aux clients, tous statuts (params: limit, defaut 5)
    - nombre_factures_client_impayees : nombre de factures clients encore impayees
    - dernieres_factures_fournisseur : dernieres factures recues des fournisseurs, tous statuts (params: limit, defaut 5)
    - nombre_factures_fournisseur_impayees : nombre de factures fournisseurs encore impayees
    - detail_facture_fournisseur : detail complet d'une facture fournisseur par numero (params: numero obligatoire)
    - detail_livraison : detail complet d'un bon de livraison client par numero (params: numero obligatoire)
    - detail_reception : detail complet d'un bon de reception fournisseur par numero (params: numero obligatoire)

    -- Paiements --
    - encaissements_periode : total des paiements recus des clients sur une periode (params: debut, fin ; si non precise, mois en cours)
    - decaissements_periode : total des paiements verses aux fournisseurs sur une periode (params: debut, fin ; si non precise, mois en cours)
    - derniers_paiements : historique des derniers paiements clients recus (params: limit, defaut 5)

    -- Mouvements de stock --
    - derniers_mouvements_stock : dernieres entrees et sorties de stock (params: limit, defaut 10)

    -- Entreprise --
    - infos_entreprise : informations de l'entreprise (nom, adresse, ICE, contact)

    -- Tableau de bord / Synthese --
    - resume_activite : resume global de l'activite de l'entreprise sur une periode : chiffre d'affaires,
      achats, paiements, impayes, commandes, livraisons, receptions et alertes de stock
      (params: debut, fin au format YYYY-MM-DD ; si non precise, mois en cours)

    -- Alertes / Urgences --
    - urgences_aujourdhui : synthese des urgences actuelles : factures echues non payees, commandes en retard,
      devis qui expirent dans les 7 prochains jours et articles en stock faible (params: limit, defaut 10)
    - factures_en_retard : factures clients et fournisseurs impayees dont la date d'echeance est deja depassee
      (params: limit, defaut 10)
    - commandes_en_retard : commandes clients a livrer et commandes fournisseurs a recevoir dont la date de
      livraison prevue est deja depassee et qui sont toujours en cours (params: limit, defaut 10)

    -- Recherche ciblee --
    - detail_facture_client : detail d'une facture client identifiee par son numero (params: numero obligatoire)
    - stock_article : stock et informations d'un article identifie par son code (params: code obligatoire)
    - factures_par_client : factures concernant un client recherche par son nom, meme partiel
      (params: client obligatoire, limit, defaut 10)
    - detail_commande : etat et detail d'une commande client ou fournisseur identifiee par son numero
      (params: numero obligatoire)

    -- Comparaison de periodes --
    - comparaison_ca : comparer le chiffre d'affaires entre deux periodes
    - comparaison_achats : comparer les achats entre deux periodes
    - comparaison_tresorerie : comparer encaissements et decaissements entre deux periodes
    - marge_periode : marge commerciale sur les ventes payees d'une periode (params: debut, fin ; mois en cours par defaut)
    - affaires_plus_rentables : affaires classees par marge commerciale (params: limit, defaut 3)
    - articles_meilleure_marge : articles classes par marge commerciale generee (params: limit, defaut 5)
    - clients_meilleure_marge : clients classes par marge commerciale generee (params: limit, defaut 3)
    - comparaison_marge : comparer la marge commerciale entre deux periodes
    - comparaison_taux_conversion : comparer le taux d'acceptation des devis entre deux periodes
      Pour toutes les intentions de comparaison, params: debut1, fin1 pour la premiere periode puis debut2, fin2 pour la seconde,
      au format YYYY-MM-DD. Si les periodes ne sont pas precisees, comparer le mois precedent (periode 1)
      au mois en cours (periode 2).

    -- Général --
    - general : salutations (bonjour, salut, merci, ça va, au revoir), culture generale,
      ou toute question qui ne correspond a aucune intention ci-dessus

    Reponds uniquement avec le JSON, rien d'autre.

    Si un historique de conversation est fourni, utilise-le seulement pour comprendre les references et les
    questions de suivi comme "et les trois premiers ?", "et le mois dernier ?" ou "et pour ce client ?".
    Classe toujours la NOUVELLE question, en conservant l'intention precedente lorsque la nouvelle formulation
    en est clairement la continuation, et remplace uniquement les parametres modifies par l'utilisateur.
    """;
    public IntentResultDTO classify(String userMessage, String history) {
        String messageWithHistory = history == null || history.isBlank()
                ? userMessage
                : "Historique recent :\n" + history + "\n\nNOUVELLE question : " + userMessage;
        String rawResponse = openAiClientService.call(SYSTEM_PROMPT, messageWithHistory);

        try {
            String cleaned = rawResponse.trim()
                    .replaceAll("^```json", "")
                    .replaceAll("^```", "")
                    .replaceAll("```$", "")
                    .trim();

            JsonNode json = objectMapper.readTree(cleaned);
            String intent = json.path("intent").asText("general");

            Map<String, Object> params = new HashMap<>();
            json.path("params").fields().forEachRemaining(
                    entry -> params.put(entry.getKey(), entry.getValue().asText())
            );

            return IntentResultDTO.builder()
                    .intent(intent)
                    .params(params)
                    .build();

        } catch (Exception e) {
            return IntentResultDTO.builder().intent("general").params(Map.of()).build();
        }
    }
}
