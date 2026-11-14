package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.GlobalSearchResultDTO;
import com.gestion.commerciale.entity.ERole;
import com.gestion.commerciale.entity.Utilisateur;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.UtilisateurRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GlobalSearchService {

    private final EntityManager entityManager;
    private final UtilisateurRepository utilisateurRepository;

    public List<GlobalSearchResultDTO> search(String login, String query, int limitPerType) {
        String term = query == null ? "" : query.trim();
        if (term.length() < 2) throw new BadRequestException("Saisissez au moins 2 caractères");

        Utilisateur user = utilisateurRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (user.getEntreprise() == null) throw new BadRequestException("Aucune entreprise associée");

        int limit = Math.max(1, Math.min(limitPerType, 10));
        Integer companyId = user.getEntreprise().getId();
        String like = "%" + term.toLowerCase() + "%";
        boolean admin = hasRole(user, ERole.ROLE_ADMIN);
        boolean seller = admin || hasRole(user, ERole.ROLE_VENDEUR);
        boolean buyer = admin || hasRole(user, ERole.ROLE_ACHETEUR);
        boolean warehouse = admin || hasRole(user, ERole.ROLE_MAGASINIER);
        boolean consultant = hasRole(user, ERole.ROLE_CONSULTANT);
        List<GlobalSearchResultDTO> results = new ArrayList<>();

        if (seller || consultant) {
            rows("SELECT c.id, c.nom, c.ice FROM Client c WHERE c.entreprise.id=:company " +
                    "AND (LOWER(c.nom) LIKE :q OR LOWER(COALESCE(c.ice,'')) LIKE :q)", companyId, like, limit)
                    .forEach(r -> results.add(result("CLIENT", r, r[1].toString(),
                            "Client" + optional(" · ICE ", r[2]), "/clients", "bi-people")));
        }
        if (buyer || consultant) {
            rows("SELECT f.id, f.nom, f.ice FROM Fournisseur f WHERE f.entreprise.id=:company " +
                    "AND (LOWER(f.nom) LIKE :q OR LOWER(COALESCE(f.ice,'')) LIKE :q)", companyId, like, limit)
                    .forEach(r -> results.add(result("FOURNISSEUR", r, r[1].toString(),
                            "Fournisseur" + optional(" · ICE ", r[2]), "/fournisseurs", "bi-building")));
        }
        if (seller || buyer || warehouse || consultant) {
            rows("SELECT a.id, a.code, a.designation, a.stock FROM Article a WHERE a.entreprise.id=:company " +
                    "AND (LOWER(a.code) LIKE :q OR LOWER(CAST(a.designation AS string)) LIKE :q)", companyId, like, limit)
                    .forEach(r -> results.add(result("ARTICLE", r, r[1] + " · " + r[2],
                            "Article · Stock " + r[3], "/articles", "bi-box-seam")));
            rows("SELECT a.id, a.nom, a.description FROM Affaire a WHERE a.entreprise.id=:company " +
                    "AND (LOWER(a.nom) LIKE :q OR LOWER(COALESCE(a.description,'')) LIKE :q)", companyId, like, limit)
                    .forEach(r -> results.add(result("AFFAIRE", r, r[1].toString(), "Affaire",
                            "/affaires", "bi-briefcase")));
        }
        if (seller) {
            addSalesDocuments(results, companyId, like, limit);
        }
        if (buyer) {
            addPurchaseDocuments(results, companyId, like, limit);
        }
        return results;
    }

    private void addSalesDocuments(List<GlobalSearchResultDTO> results, Integer company, String q, int limit) {
        rows("SELECT d.id,d.numero,d.client.nom,d.statut FROM Devis d WHERE d.entreprise.id=:company " +
                "AND (LOWER(d.numero) LIKE :q OR LOWER(d.client.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("DEVIS", r, r[1].toString(), r[2] + " · " + r[3],
                        "/devis/" + r[0], "bi-file-earmark-text")));
        rows("SELECT b.id,b.numero,b.client.nom,b.statut FROM BonCommandeClient b WHERE b.entreprise.id=:company " +
                "AND (LOWER(b.numero) LIKE :q OR LOWER(b.client.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("COMMANDE_CLIENT", r, r[1].toString(), r[2] + " · " + r[3],
                        "/commandes-client/" + r[0], "bi-cart-check")));
        rows("SELECT b.id,b.numero,b.client.nom,b.statut FROM BonLivraison b WHERE b.entreprise.id=:company " +
                "AND (LOWER(b.numero) LIKE :q OR LOWER(b.client.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("LIVRAISON", r, r[1].toString(), r[2] + " · " + r[3],
                        "/livraisons/" + r[0], "bi-truck")));
        rows("SELECT f.id,f.numero,f.client.nom,f.statut FROM FactureClient f WHERE f.entreprise.id=:company " +
                "AND (LOWER(f.numero) LIKE :q OR LOWER(f.client.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("FACTURE_CLIENT", r, r[1].toString(), r[2] + " · " + r[3],
                        "/factures/" + r[0], "bi-receipt")));
    }

    private void addPurchaseDocuments(List<GlobalSearchResultDTO> results, Integer company, String q, int limit) {
        rows("SELECT b.id,b.numero,b.fournisseur.nom,b.statut FROM BonCommandeFournisseur b WHERE b.entreprise.id=:company " +
                "AND (LOWER(b.numero) LIKE :q OR LOWER(b.fournisseur.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("COMMANDE_FOURNISSEUR", r, r[1].toString(), r[2] + " · " + r[3],
                        "/commandes-fournisseur/" + r[0], "bi-bag-check")));
        rows("SELECT b.id,b.numero,b.fournisseur.nom,b.statut FROM BonReceptionFournisseur b WHERE b.entreprise.id=:company " +
                "AND (LOWER(b.numero) LIKE :q OR LOWER(b.fournisseur.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("RECEPTION", r, r[1].toString(), r[2] + " · " + r[3],
                        "/receptions-fournisseur/" + r[0], "bi-box-arrow-in-down")));
        rows("SELECT f.id,f.numero,f.fournisseur.nom,f.statut FROM FactureFournisseur f WHERE f.entreprise.id=:company " +
                "AND (LOWER(f.numero) LIKE :q OR LOWER(f.fournisseur.nom) LIKE :q)", company, q, limit)
                .forEach(r -> results.add(result("FACTURE_FOURNISSEUR", r, r[1].toString(), r[2] + " · " + r[3],
                        "/factures-fournisseur/" + r[0], "bi-file-earmark-check")));
    }

    private List<Object[]> rows(String jpql, Integer company, String q, int limit) {
        return entityManager.createQuery(jpql, Object[].class).setParameter("company", company)
                .setParameter("q", q).setMaxResults(limit).getResultList();
    }

    private GlobalSearchResultDTO result(String type, Object[] row, String title,
                                         String subtitle, String path, String icon) {
        return GlobalSearchResultDTO.builder().type(type).id(((Number) row[0]).intValue())
                .title(title).subtitle(subtitle).path(path).icon(icon).build();
    }

    private String optional(String prefix, Object value) {
        return value == null || value.toString().isBlank() ? "" : prefix + value;
    }

    private boolean hasRole(Utilisateur user, ERole role) {
        return user.getRoles().stream().anyMatch(r -> r.getNom() == role);
    }
}
