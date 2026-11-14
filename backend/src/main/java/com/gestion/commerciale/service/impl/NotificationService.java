package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.NotificationDTO;
import com.gestion.commerciale.entity.ERole;
import com.gestion.commerciale.entity.Notification;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final FactureClientRepository factureClientRepository;
    private final FactureFournisseurRepository factureFournisseurRepository;
    private final BonCommandeClientRepository bonCommandeClientRepository;
    private final BonCommandeFournisseurRepository bonCommandeFournisseurRepository;
    private final DevisRepository devisRepository;
    private final ArticleRepository articleRepository;

    public List<NotificationDTO> getNotifications(String login, int limit) {
        Utilisateur utilisateur = getUtilisateur(login);
        synchroniserAlertes(utilisateur);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return notificationRepository.findByUtilisateurIdAndResolueFalseOrderByDateCreationDesc(
                utilisateur.getId(), PageRequest.of(0, safeLimit)).stream().map(this::toDTO).toList();
    }

    public long getUnreadCount(String login) {
        Utilisateur utilisateur = getUtilisateur(login);
        synchroniserAlertes(utilisateur);
        return notificationRepository.countByUtilisateurIdAndLueFalseAndResolueFalse(utilisateur.getId());
    }

    public NotificationDTO markAsRead(Integer notificationId, String login) {
        Utilisateur utilisateur = getUtilisateur(login);
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getUtilisateur().getId().equals(utilisateur.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        notification.setLue(true);
        return toDTO(notificationRepository.save(notification));
    }

    public void markAllAsRead(String login) {
        Utilisateur utilisateur = getUtilisateur(login);
        List<Notification> notifications = notificationRepository.findByUtilisateurIdAndLueFalseAndResolueFalse(utilisateur.getId());
        notifications.forEach(notification -> notification.setLue(true));
        notificationRepository.saveAll(notifications);
    }

    private void synchroniserAlertes(Utilisateur utilisateur) {
        if (utilisateur.getEntreprise() == null) return;
        Integer entrepriseId = utilisateur.getEntreprise().getId();
        LocalDate today = LocalDate.now();
        LocalDate warningLimit = today.plusDays(7);
        var page = PageRequest.of(0, 20);
        Set<String> activeKeys = new HashSet<>();

        boolean admin = hasRole(utilisateur, ERole.ROLE_ADMIN);
        boolean ventes = admin || hasRole(utilisateur, ERole.ROLE_VENDEUR);
        boolean achats = admin || hasRole(utilisateur, ERole.ROLE_ACHETEUR);
        boolean stock = admin || hasRole(utilisateur, ERole.ROLE_MAGASINIER);

        if (ventes) {
            factureClientRepository.findFacturesEnRetard(entrepriseId, today, page).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "FACTURE_CLIENT", "Facture client échue",
                            "La facture " + value(item, "numero") + " de " + value(item, "client") +
                                    " est échue depuis le " + value(item, "echeance") + ".",
                            "URGENT", "/vente/factures", "FC:" + value(item, "numero")));

            factureClientRepository.findFacturesArrivantAEcheance(entrepriseId, today, warningLimit, page).forEach(item -> {
                long days = daysUntil(item, "echeance", today);
                upsertNotification(utilisateur, activeKeys, "FACTURE_CLIENT", "Échéance facture client",
                        "La facture " + value(item, "numero") + " de " + value(item, "client") +
                                " arrive à échéance " + deadlineLabel(days) + ".",
                        days <= 3 ? "AVERTISSEMENT" : "INFORMATION", "/vente/factures", "FC:" + value(item, "numero"));
            });

            bonCommandeClientRepository.findCommandesEnRetard(entrepriseId, today, page).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "COMMANDE_CLIENT", "Commande client en retard",
                            "La commande " + value(item, "numero") + " pour " + value(item, "client") +
                                    " devait être livrée le " + value(item, "livraisonPrevue") + ".",
                            "URGENT", "/vente/commandes", "BCC:" + value(item, "numero")));

            bonCommandeClientRepository.findCommandesArrivantAEcheance(entrepriseId, today, warningLimit, page).forEach(item -> {
                long days = daysUntil(item, "livraisonPrevue", today);
                upsertNotification(utilisateur, activeKeys, "COMMANDE_CLIENT", "Livraison client à venir",
                        "La commande " + value(item, "numero") + " pour " + value(item, "client") +
                                " doit être livrée " + deadlineLabel(days) + ".",
                        days <= 3 ? "AVERTISSEMENT" : "INFORMATION", "/vente/commandes", "BCC:" + value(item, "numero"));
            });

            devisRepository.findDevisExpirantBientot(entrepriseId, today, today.plusDays(7), page).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "DEVIS", "Devis bientôt expiré",
                            "Le devis " + value(item, "numero") + " de " + value(item, "client") +
                                    " expire le " + value(item, "dateValidite") + ".",
                            "AVERTISSEMENT", "/vente/devis", "DEV:" + value(item, "numero") + ":" + value(item, "dateValidite")));
        }

        if (achats) {
            factureFournisseurRepository.findFacturesEnRetard(entrepriseId, today, page).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "FACTURE_FOURNISSEUR", "Facture fournisseur échue",
                            "La facture " + value(item, "numero") + " de " + value(item, "fournisseur") +
                                    " est échue depuis le " + value(item, "echeance") + ".",
                            "URGENT", "/achat/factures", "FF:" + value(item, "numero")));

            factureFournisseurRepository.findFacturesArrivantAEcheance(entrepriseId, today, warningLimit, page).forEach(item -> {
                long days = daysUntil(item, "echeance", today);
                upsertNotification(utilisateur, activeKeys, "FACTURE_FOURNISSEUR", "Échéance fournisseur à venir",
                        "La facture " + value(item, "numero") + " de " + value(item, "fournisseur") +
                                " doit être payée " + deadlineLabel(days) + ".",
                        days <= 3 ? "AVERTISSEMENT" : "INFORMATION", "/achat/factures", "FF:" + value(item, "numero"));
            });

            bonCommandeFournisseurRepository.findCommandesEnRetard(entrepriseId, today, page).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "COMMANDE_FOURNISSEUR", "Commande fournisseur en retard",
                            "La commande " + value(item, "numero") + " de " + value(item, "fournisseur") +
                                    " était attendue le " + value(item, "livraisonPrevue") + ".",
                            "URGENT", "/achat/commandes", "BCF:" + value(item, "numero")));

            bonCommandeFournisseurRepository.findCommandesArrivantAEcheance(entrepriseId, today, warningLimit, page).forEach(item -> {
                long days = daysUntil(item, "livraisonPrevue", today);
                upsertNotification(utilisateur, activeKeys, "COMMANDE_FOURNISSEUR", "Réception fournisseur à venir",
                        "La commande " + value(item, "numero") + " de " + value(item, "fournisseur") +
                                " est attendue " + deadlineLabel(days) + ".",
                        days <= 3 ? "AVERTISSEMENT" : "INFORMATION", "/achat/commandes", "BCF:" + value(item, "numero"));
            });
        }

        if (stock) {
            articleRepository.findArticlesSousSeuilAlerteByEntrepriseId(entrepriseId).forEach(item ->
                    upsertNotification(utilisateur, activeKeys, "STOCK", "Stock faible",
                            value(item, "code") + " — " + value(item, "designation") +
                                    " : stock " + value(item, "stock") + ", seuil " + value(item, "seuilAlerte") + ".",
                            "AVERTISSEMENT", "/stock", "STOCK:" + value(item, "code")));
        }

        resolveInactive(utilisateur, activeKeys);
    }

    private void upsertNotification(Utilisateur utilisateur, Set<String> activeKeys,
                                    String categorie, String titre, String message,
                                    String niveau, String path, String businessKey) {
        String dedupeKey = utilisateur.getId() + ":" + businessKey;
        activeKeys.add(dedupeKey);
        Notification notification = notificationRepository.findByDedupeKey(dedupeKey).orElse(null);
        if (notification == null) {
            notificationRepository.save(Notification.builder()
                    .utilisateur(utilisateur).entreprise(utilisateur.getEntreprise())
                    .categorie(categorie).titre(titre).message(message).niveau(niveau)
                    .path(path).lue(false).resolue(false).dedupeKey(dedupeKey).build());
            return;
        }

        boolean changed = !titre.equals(notification.getTitre()) || !niveau.equals(notification.getNiveau());
        notification.setCategorie(categorie);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setNiveau(niveau);
        notification.setPath(path);
        notification.setResolue(false);
        notification.setDateResolution(null);
        if (changed) notification.setLue(false);
        notificationRepository.save(notification);
    }

    private void resolveInactive(Utilisateur utilisateur, Set<String> activeKeys) {
        List<Notification> active = notificationRepository.findByUtilisateurIdAndResolueFalse(utilisateur.getId());
        active.stream().filter(notification -> !activeKeys.contains(notification.getDedupeKey())).forEach(notification -> {
            notification.setResolue(true);
            notification.setLue(true);
            notification.setDateResolution(LocalDateTime.now());
        });
        notificationRepository.saveAll(active);
    }

    private long daysUntil(Map<String, Object> item, String key, LocalDate today) {
        Object value = item.get(key);
        LocalDate date = value instanceof LocalDate localDate ? localDate : LocalDate.parse(value.toString());
        return ChronoUnit.DAYS.between(today, date);
    }

    private String deadlineLabel(long days) {
        if (days == 0) return "aujourd'hui";
        if (days == 1) return "demain";
        return "dans " + days + " jours";
    }

    private boolean hasRole(Utilisateur utilisateur, ERole role) {
        return utilisateur.getRoles().stream().anyMatch(r -> r.getNom() == role);
    }

    private String value(Map<String, Object> item, String key) {
        Object value = item.get(key);
        return value == null ? "—" : value.toString();
    }

    private Utilisateur getUtilisateur(String login) {
        return utilisateurRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder().id(n.getId()).categorie(n.getCategorie())
                .titre(n.getTitre()).message(n.getMessage()).niveau(n.getNiveau())
                .path(n.getPath()).lue(n.getLue()).resolue(n.getResolue())
                .dateCreation(n.getDateCreation()).build();
    }
}
