# Rapport de conception et d'utilisation de NOVA

## Assistant IA intégré à l'application de gestion commerciale

**Projet :** Application de gestion commerciale  
**Assistant :** NOVA — Assistant commercial IA  
**Technologies principales :** Spring Boot, React, MySQL, Groq API et Llama 3.3  
**Langue principale :** Français

---

## 1. Présentation générale

NOVA est un assistant conversationnel intégré à l'application de gestion commerciale. Il permet à un utilisateur authentifié d'interroger les données réelles de son entreprise avec des questions formulées en langage naturel.

L'objectif est de rendre les informations commerciales plus faciles à consulter, sans obliger l'utilisateur à naviguer manuellement dans chaque module ou à écrire des requêtes techniques.

Exemples :

- « Quel est mon chiffre d'affaires ce mois-ci ? »
- « Quels clients ont des factures impayées ? »
- « Quelles sont les urgences aujourd'hui ? »
- « Compare mes achats avec le mois dernier. »
- « Quel est le stock de l'article ART001 ? »

NOVA ne possède pas un accès libre à la base de données. Le backend détermine les opérations autorisées, récupère les données de l'entreprise connectée, puis demande au modèle IA de les présenter clairement.

---

## 2. Objectifs

NOVA répond aux objectifs suivants :

1. comprendre les questions formulées naturellement ;
2. identifier l'intention métier de l'utilisateur ;
3. extraire les paramètres utiles : dates, limite, code, numéro ou nom ;
4. récupérer les données réelles avec les repositories Spring Data JPA ;
5. isoler strictement les données de chaque entreprise ;
6. reformuler le résultat en français ;
7. afficher des actions permettant d'ouvrir les modules concernés ;
8. afficher des graphiques optionnels pour les comparaisons ;
9. mémoriser les derniers échanges pour comprendre les questions de suivi.

---

## 3. Architecture fonctionnelle

Le traitement suit le flux suivant :

```text
Utilisateur authentifié
        ↓
Interface NOVA dans React
        ↓ POST /api/assistant/chat
AssistantController
        ↓
Identification de l'utilisateur et de son entreprise
        ↓
AssistantService
        ↓
IntentClassifierService + historique récent
        ↓
Intention et paramètres structurés
        ↓
AssistantDataService
        ↓
Repositories Spring Data JPA
        ↓
Base de données MySQL
        ↓
Reformulation avec Groq / Llama
        ↓
Texte + intention + actions + graphique éventuel
        ↓
Affichage dans NOVA
```

### 3.1 AssistantController

Le contrôleur expose l'API du chat :

```http
POST /api/assistant/chat
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "message": "Quels sont mes clients impayés ?"
}
```

Il récupère le login à partir de l'authentification Spring Security, charge l'utilisateur, puis récupère son `entrepriseId`.

L'identifiant de l'entreprise n'est pas fourni librement par le frontend. Cette décision empêche un utilisateur de demander les données d'une autre entreprise.

### 3.2 IntentClassifierService

Ce service utilise le modèle IA comme classifieur. Il transforme la question en JSON :

```json
{
  "intent": "clients_impayes",
  "params": {
    "limit": "5"
  }
}
```

Le classifieur ne récupère aucune donnée dans MySQL. Il sert uniquement à comprendre la demande.

### 3.3 AssistantDataService

Ce service associe les intentions aux méthodes de données. Il centralise les appels aux repositories et construit les résultats utilisés par NOVA.

Exemples :

- calcul du chiffre d'affaires sur une période ;
- recherche des factures échues ;
- récupération des articles en stock faible ;
- comparaison de deux périodes ;
- constitution du résumé d'activité.

### 3.4 Repositories

Les repositories utilisent des requêtes JPQL contrôlées. Chaque requête métier sensible contient le filtre `entrepriseId`.

Le modèle IA ne génère donc pas de SQL et ne peut pas choisir arbitrairement une table ou une colonne.

### 3.5 OpenAiClientService

Malgré son nom historique, ce service communique actuellement avec Groq à travers une API compatible avec le format OpenAI Chat Completions.

Configuration actuelle :

```yaml
assistant:
  groq:
    api-key: ${GROQ_API_KEY}
    model: llama-3.3-70b-versatile
    base-url: https://api.groq.com/openai/v1/chat/completions
```

La température est faible afin d'obtenir des réponses plus stables et factuelles.

---

## 4. Configuration et lancement

### 4.1 Clé Groq

La clé ne doit jamais être écrite directement dans le code ou envoyée dans le rapport.

Sous Windows, elle peut être définie dans l'environnement :

```cmd
set GROQ_API_KEY=votre_cle_groq
```

Le projet contient des fichiers `.env.cmd` et `.env.cmd.example` permettant de préparer l'environnement local. Le véritable fichier contenant la clé doit rester ignoré par Git.

### 4.2 Base de données

MySQL doit être démarré et la configuration de `application.yml` doit correspondre à l'environnement local.

### 4.3 Backend

Depuis le dossier `backend` :

```cmd
mvn spring-boot:run
```

Une compilation seule peut être vérifiée avec :

```cmd
mvn -DskipTests compile
```

### 4.4 Frontend

Depuis le dossier `frontend` :

```cmd
npm install
npm run dev
```

Pour vérifier le bundle de production :

```cmd
npm run build
```

---

## 5. Utilisation de NOVA

### 5.1 Ouverture

Après authentification, le bouton flottant « Demander à NOVA » apparaît dans le `Layout` de l'application.

Un clic ouvre le panneau de conversation. Le message d'accueil dépend de l'heure :

- matin : « Bonjour » ;
- après-midi : « Bon après-midi » ;
- soir et nuit : « Bonsoir ».

### 5.2 Envoi d'une question

L'utilisateur saisit sa demande puis :

- appuie sur `Entrée` pour envoyer ;
- utilise `Maj + Entrée` pour ajouter une nouvelle ligne ;
- ou clique sur le bouton d'envoi.

### 5.3 Copier et modifier

Sous chaque message, l'utilisateur peut :

- copier le contenu dans le presse-papiers ;
- reprendre un message utilisateur avec l'icône crayon, le modifier puis le renvoyer.

### 5.4 Nouvelle conversation

Le bouton de suppression placé dans l'en-tête efface :

- les messages visibles dans le widget ;
- l'historique backend de l'utilisateur et de l'entreprise connectés.

API associée :

```http
DELETE /api/assistant/history
Authorization: Bearer <JWT>
```

### 5.5 Actions contextuelles

Certaines réponses contiennent des boutons permettant d'ouvrir directement le module approprié.

Exemples :

- « Voir les clients » ;
- « Factures clients » ;
- « Ouvrir le stock » ;
- « Commandes fournisseurs » ;
- « Ouvrir le tableau de bord ».

Ces actions sont générées par le backend selon l'intention détectée.

### 5.6 Graphiques

Pour les comparaisons et les synthèses financières, NOVA propose un bouton :

```text
Afficher le graphique
```

Le graphique reste fermé par défaut. L'utilisateur peut l'afficher ou le masquer.

Si toutes les valeurs sont égales à zéro, NOVA n'affiche pas un axe trompeur. Il indique :

```text
Aucune donnée à représenter.
Les montants des deux périodes sont égaux à 0 DH.
```

---

## 6. Questions disponibles

### 6.1 Clients et ventes

- « Combien de clients actifs avons-nous ? »
- « Liste les dix premiers clients. »
- « Quels clients ont des impayés ? »
- « Quels sont les trois meilleurs clients ? »
- « Quel est mon chiffre d'affaires ce mois-ci ? »

### 6.2 Devis

- « Combien de devis avons-nous ? »
- « Quels devis sont en attente ? »
- « Quels devis sont expirés ? »
- « Quel est le montant des devis acceptés ? »

### 6.3 Affaires

- « Combien d'affaires sont actives ? »
- « Liste les affaires actives. »
- « Quelles affaires sont inactives ? »

### 6.4 Articles, familles et stock

- « Combien d'articles actifs avons-nous ? »
- « Liste les articles. »
- « Quels articles sont en stock faible ? »
- « Quel est le stock de l'article ART001 ? »
- « Liste les familles d'articles. »
- « Affiche les derniers mouvements de stock. »

### 6.5 Fournisseurs et achats

- « Combien de fournisseurs actifs avons-nous ? »
- « Liste les fournisseurs. »
- « Quels fournisseurs devons-nous payer ? »
- « Quels sont les meilleurs fournisseurs ? »
- « Quel est le total des achats ce mois-ci ? »

### 6.6 Commandes, livraisons et réceptions

- « Combien de commandes clients sont en cours ? »
- « Affiche les dernières commandes clients. »
- « Où en est la commande BCC-2026-004 ? »
- « Quelles commandes auraient déjà dû être livrées ? »
- « Affiche les commandes fournisseurs en cours. »
- « Quelles livraisons sont en cours ? »
- « Quelles réceptions sont en attente ? »

### 6.7 Factures

- « Donne-moi le détail de la facture FC-2026-0012. »
- « Quelles factures concernent le client Ibtihal Chemlali ? »
- « Quelles factures concernent le client Chemlali Ibtihal ? »
- « Combien de factures clients sont impayées ? »
- « Quelles factures sont en retard ? »
- « Affiche les dernières factures fournisseurs. »

La recherche d'un client ignore l'ordre des mots, les majuscules, les accents et certaines différences de ponctuation.

### 6.8 Paiements

- « Combien avons-nous encaissé ce mois-ci ? »
- « Combien avons-nous versé aux fournisseurs ? »
- « Affiche les derniers paiements clients. »

### 6.9 Résumé et urgences

- « Fais-moi un résumé de l'activité de ce mois. »
- « Quelles sont les urgences aujourd'hui ? »
- « Quelles factures sont échues ? »
- « Quelles commandes sont en retard ? »

Les urgences regroupent notamment :

- factures clients échues ;
- factures fournisseurs échues ;
- commandes clients en retard ;
- commandes fournisseurs en retard ;
- devis expirant dans les sept jours ;
- articles en stock faible.

### 6.10 Comparaisons

- « Compare mon chiffre d'affaires avec le mois dernier. »
- « Compare mes achats de juin et juillet 2026. »
- « Compare mes entrées et sorties d'argent avec le mois précédent. »

Sans dates explicites :

- période 1 = mois précédent ;
- période 2 = mois en cours.

Le backend calcule :

```text
Écart = valeur période 2 - valeur période 1
Pourcentage = écart × 100 / valeur période 1
```

Si la valeur de référence est nulle, le pourcentage est déclaré non calculable.

---

## 7. Mémoire conversationnelle

NOVA conserve les six derniers échanges pour comprendre les demandes de suivi.

Exemple :

```text
Utilisateur : Donne-moi les meilleurs clients.
NOVA : Voici les meilleurs clients...
Utilisateur : Et seulement les trois premiers ?
```

Le classifieur comprend que la seconde demande conserve l'intention `meilleur_client` et modifie uniquement la limite.

### 7.1 Isolation

La clé de mémoire contient :

```text
utilisateurId + entrepriseId
```

La conversation ne peut donc pas être partagée entre deux utilisateurs ou deux entreprises.

### 7.2 Limites

La mémoire actuelle :

- conserve au maximum six échanges ;
- limite chaque texte mémorisé à 1 500 caractères ;
- est stockée en RAM ;
- disparaît lors du redémarrage du backend ;
- n'est pas synchronisée entre plusieurs instances du serveur.

---

## 8. Sécurité et fiabilité

### 8.1 Authentification

L'accès à l'assistant nécessite un JWT valide.

### 8.2 Isolation des entreprises

`entrepriseId` est récupéré depuis l'utilisateur authentifié. Il n'est plus fixé à une valeur constante et n'est pas accepté directement depuis la requête frontend.

### 8.3 Données réelles uniquement

Le prompt de reformulation impose :

- de répondre seulement à partir des données fournies ;
- de ne jamais inventer de chiffre ;
- d'utiliser le dirham marocain ;
- de signaler les données absentes ;
- de respecter les interprétations métier préparées par le backend.

### 8.4 Validation des paramètres

Le backend protège notamment :

- les limites de résultats, entre 1 et 50 ;
- les dates vides ou invalides ;
- les périodes dont les bornes sont inversées ;
- les paramètres obligatoires comme un numéro ou un code.

### 8.5 Confidentialité

La clé Groq est fournie par variable d'environnement. Elle ne doit jamais être ajoutée à Git, au frontend ou à un document partagé.

---

## 9. Format de la réponse API

Une réponse peut contenir du texte, des actions et un graphique :

```json
{
  "success": true,
  "data": {
    "reply": "Le chiffre d'affaires a augmenté...",
    "intent": "comparaison_ca",
    "actions": [
      {
        "label": "Ouvrir le tableau de bord",
        "path": "/dashboard",
        "icon": "bi-speedometer2"
      }
    ],
    "chart": {
      "type": "bar",
      "title": "Comparaison du chiffre d'affaires",
      "unit": "DH",
      "labels": [
        "2026-06-01 → 2026-06-30",
        "2026-07-01 → 2026-07-31"
      ],
      "datasets": [
        {
          "label": "Chiffre d'affaires",
          "color": "#1A6FE8",
          "values": [75000, 104000]
        }
      ]
    }
  }
}
```

---

## 10. Scénario complet de démonstration

Pour présenter NOVA à l'encadrant :

1. se connecter à l'application ;
2. ouvrir NOVA depuis le bouton flottant ;
3. poser : « Fais-moi un résumé de l'activité de ce mois. » ;
4. afficher le graphique proposé ;
5. utiliser le bouton ouvrant le tableau de bord ;
6. poser : « Quels clients ont des impayés ? » ;
7. utiliser l'action « Voir les factures » ;
8. poser : « Quel est le stock de l'article ART001 ? » ;
9. poser : « Quelles sont les urgences aujourd'hui ? » ;
10. poser : « Compare mon chiffre d'affaires avec le mois dernier. » ;
11. démontrer la mémoire avec : « Et pour les achats ? » ;
12. copier une réponse ;
13. modifier une question utilisateur ;
14. effacer l'historique avec « Nouvelle conversation ».

---

## 11. Tests recommandés

### Test fonctionnel

- vérifier chaque famille d'intentions ;
- comparer les réponses aux données de MySQL ;
- tester des résultats vides ;
- tester des codes et numéros inexistants ;
- tester un nom de client dans les deux ordres ;
- tester des dates invalides ;
- tester la mémoire conversationnelle.

### Test de sécurité

- vérifier qu'un utilisateur ne voit que son entreprise ;
- appeler l'API sans JWT ;
- appeler l'API avec un utilisateur sans entreprise ;
- vérifier qu'aucune clé n'est présente dans le bundle frontend.

### Test d'interface

- affichage sur ordinateur et mobile ;
- copie d'un message ;
- modification d'une question ;
- navigation par actions ;
- ouverture et fermeture d'un graphique ;
- état sans données lorsque les valeurs valent zéro.

---

## 12. Limites actuelles et améliorations possibles

### Limites

1. la mémoire disparaît au redémarrage ;
2. une question métier utilise généralement deux appels au modèle ;
3. la disponibilité dépend de Groq et de la connexion réseau ;
4. les graphiques couvrent principalement les comparaisons et la synthèse ;
5. certaines recherches nécessitent un code ou un numéro suffisamment précis.

### Évolutions possibles

- enregistrer les conversations en base ;
- ajouter plusieurs conversations nommées ;
- comprendre le darija ;
- exporter les résultats en PDF ou Excel ;
- afficher des alertes proactives ;
- ajouter des suggestions contextuelles après chaque réponse ;
- réduire le nombre d'appels IA pour les réponses simples ;
- ajouter des délais d'attente, nouvelles tentatives et gestion spécifique des erreurs Groq ;
- ajouter des tests unitaires et d'intégration dédiés à l'assistant.

---

## 13. Conclusion

NOVA apporte une couche conversationnelle sécurisée à l'application de gestion commerciale. Son architecture sépare clairement :

- la compréhension linguistique par l'IA ;
- les règles métier dans Spring Boot ;
- l'accès aux données par les repositories ;
- la présentation interactive dans React.

Cette séparation permet de bénéficier du langage naturel tout en conservant le contrôle des requêtes, des calculs et de la sécurité. NOVA ne remplace pas les modules de gestion : il simplifie leur consultation et guide l'utilisateur vers les écrans appropriés.

