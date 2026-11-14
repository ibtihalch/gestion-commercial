package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonLivraisonDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.exception.StockInsuffisantException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.BonLivraisonService;
import com.gestion.commerciale.service.NumeroGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BonLivraisonServiceImpl implements BonLivraisonService {

    private final BonLivraisonRepository      bonLivraisonRepository;
    private final ClientRepository            clientRepository;
    private final AffaireRepository           affaireRepository;
    private final ArticleRepository           articleRepository;
    private final UtilisateurRepository       utilisateurRepository;
    private final EntrepriseRepository        entrepriseRepository;
    private final BonCommandeClientRepository bonCommandeClientRepository;
    private final MouvementStockRepository    mouvementStockRepository;
    private final NumeroGeneratorService      numeroGeneratorService;
    // ✅ NOUVEAU — pour mettre à jour le statut du BCC
    private final BonCommandeClientRepository bccRepository;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BonLivraisonDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BonLivraisonDTO> findAll(Integer entrepriseId,
                                          String search,
                                          BonLivraison.Statut statut,
                                          Integer clientId,
                                          LocalDate dateDebut,
                                          LocalDate dateFin,
                                          Pageable pageable) {

        Specification<BonLivraison> spec = BonLivraisonSpecification.filtrer(
                entrepriseId, search, statut, clientId, dateDebut, dateFin);

        return bonLivraisonRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BonLivraisonDTO findById(Integer id) {
        return toDTO(bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison", id)));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    public BonLivraisonDTO create(BonLivraisonDTO dto, String loginUtilisateur) {
        verifierStockDisponible(dto);
        BonLivraison bl = buildBon(dto, loginUtilisateur);
        bl.setNumero(numeroGeneratorService.generer("BL", "bon_livraison", "numero"));
        BonLivraison saved = bonLivraisonRepository.save(bl);
        enregistrerSorties(dto, saved);

        // ✅ Mise à jour automatique : BCC → livre
        if (dto.getBonCommandeClientId() != null) {
            bccRepository.findById(dto.getBonCommandeClientId()).ifPresent(bcc -> {
                bcc.setStatut(BonCommandeClient.Statut.livre);
                bccRepository.save(bcc);
            });
        }

        return toDTO(saved);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    @Override
    public BonLivraisonDTO update(Integer id, BonLivraisonDTO dto, String loginUtilisateur) {
        BonLivraison existing = bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison", id));

        enregistrerEntrees(existing, "Annulation modification BL " + existing.getNumero());
        verifierStockDisponible(dto);

        BonLivraison bl = buildBon(dto, loginUtilisateur);
        bl.setId(id);
        bl.setNumero(existing.getNumero());
        BonLivraison saved = bonLivraisonRepository.save(bl);

        enregistrerSorties(dto, saved);
        return toDTO(saved);
    }

    // ── UPDATE STATUT ─────────────────────────────────────────────────────────

    @Override
    public BonLivraisonDTO updateStatut(Integer id, BonLivraison.Statut statut) {
        BonLivraison bl = bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison", id));

        BonLivraison.Statut ancienStatut = bl.getStatut();

        if (statut == BonLivraison.Statut.annule && ancienStatut != BonLivraison.Statut.annule) {
            enregistrerEntrees(bl, "Annulation BL " + bl.getNumero());
        }

        if (ancienStatut == BonLivraison.Statut.annule && statut != BonLivraison.Statut.annule) {
            BonLivraisonDTO dtoDetails = toDtoDetails(bl);
            verifierStockDisponible(dtoDetails);
            enregistrerSorties(dtoDetails, bl);
        }

        bl.setStatut(statut);
        return toDTO(bonLivraisonRepository.save(bl));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Override
    public void delete(Integer id) {
        BonLivraison bl = bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison", id));
        enregistrerEntrees(bl, "Suppression BL " + bl.getNumero());
        bonLivraisonRepository.deleteById(id);
    }

    // ── Gestion stock ─────────────────────────────────────────────────────────

    private void verifierStockDisponible(BonLivraisonDTO dto) {
        if (dto.getDetails() == null) return;
        for (BonLivraisonDTO.DetailDTO d : dto.getDetails()) {
            Article article = articleRepository.findById(d.getArticleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
            BigDecimal stockActuel = article.getStock() != null ? article.getStock() : BigDecimal.ZERO;
            if (stockActuel.compareTo(d.getQte()) < 0) {
                throw new StockInsuffisantException(
                        "Stock insuffisant pour [" + article.getCode() + "] "
                        + article.getDesignation()
                        + " — disponible : " + stockActuel
                        + ", demandé : " + d.getQte());
            }
        }
    }

    private void enregistrerSorties(BonLivraisonDTO dto, BonLivraison bl) {
        if (dto.getDetails() == null) return;
        for (BonLivraisonDTO.DetailDTO d : dto.getDetails()) {
            Article article = articleRepository.findById(d.getArticleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
            BigDecimal stockAvant = article.getStock() != null ? article.getStock() : BigDecimal.ZERO;
            BigDecimal stockApres = stockAvant.subtract(d.getQte());
            article.setStock(stockApres);
            articleRepository.save(article);
            mouvementStockRepository.save(MouvementStock.builder()
                    .article(article)
                    .typeMouvement(MouvementStock.TypeMouvement.sortie)
                    .qte(d.getQte())
                    .stockAvant(stockAvant)
                    .stockApres(stockApres)
                    .referenceDocument(bl.getNumero())
                    .bonLivraison(bl)
                    .entreprise(bl.getEntreprise())
                    .observations("Sortie automatique — BL : " + bl.getNumero())
                    .build());
        }
    }

    private void enregistrerEntrees(BonLivraison bl, String motif) {
        if (bl.getDetails() == null) return;
        for (BonLivraisonDetail detail : bl.getDetails()) {
            Article article = detail.getArticle();
            BigDecimal stockAvant = article.getStock() != null ? article.getStock() : BigDecimal.ZERO;
            BigDecimal stockApres = stockAvant.add(detail.getQte());
            article.setStock(stockApres);
            articleRepository.save(article);
            mouvementStockRepository.save(MouvementStock.builder()
                    .article(article)
                    .typeMouvement(MouvementStock.TypeMouvement.entree)
                    .qte(detail.getQte())
                    .stockAvant(stockAvant)
                    .stockApres(stockApres)
                    .referenceDocument(bl.getNumero())
                    .bonLivraison(bl)
                    .entreprise(bl.getEntreprise())
                    .observations(motif)
                    .build());
        }
    }

    private BonLivraisonDTO toDtoDetails(BonLivraison bl) {
        List<BonLivraisonDTO.DetailDTO> details = bl.getDetails() == null ? List.of() :
                bl.getDetails().stream().map(d -> BonLivraisonDTO.DetailDTO.builder()
                        .articleId(d.getArticle().getId())
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(d.getMontant())
                        .build()).collect(Collectors.toList());
        BonLivraisonDTO dto = new BonLivraisonDTO();
        dto.setDetails(details);
        return dto;
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private BonLivraison buildBon(BonLivraisonDTO dto, String loginUtilisateur) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", dto.getClientId()));
        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));

        BonLivraison bl = new BonLivraison();
        bl.setClient(client);
        bl.setDateLivraison(dto.getDateLivraison());
        bl.setStatut(dto.getStatut() != null ? dto.getStatut() : BonLivraison.Statut.en_cours);
        bl.setObservations(dto.getObservations());
        bl.setUtilisateur(user);

        if (dto.getAffaireId() != null)
            affaireRepository.findById(dto.getAffaireId()).ifPresent(bl::setAffaire);
        if (dto.getBonCommandeClientId() != null)
            bonCommandeClientRepository.findById(dto.getBonCommandeClientId()).ifPresent(bl::setBonCommandeClient);
        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(bl::setEntreprise);

        List<BonLivraisonDetail> details = new ArrayList<>();
        BigDecimal totalHt = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (BonLivraisonDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
                BigDecimal montant = d.getPrixUnitaire().multiply(d.getQte());
                details.add(BonLivraisonDetail.builder()
                        .bonLivraison(bl)
                        .article(article)
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(montant)
                        .build());
                totalHt = totalHt.add(montant);
            }
        }

        BigDecimal tva = totalHt.multiply(BigDecimal.valueOf(0.20));
        bl.setMontantHt(totalHt);
        bl.setTva(tva);
        bl.setMontantTtc(totalHt.add(tva));
        bl.setDetails(details);
        return bl;
    }

    // ── Mapping DTO ──────────────────────────────────────────────────────────

    private BonLivraisonDTO toDTO(BonLivraison bl) {
        List<BonLivraisonDTO.DetailDTO> details = bl.getDetails() == null ? List.of() :
                bl.getDetails().stream().map(d -> BonLivraisonDTO.DetailDTO.builder()
                        .id(d.getId())
                        .articleId(d.getArticle().getId())
                        .articleCode(d.getArticle().getCode())
                        .articleDesignation(d.getArticle().getDesignation())
                        .articleUnite(d.getArticle().getUnite())
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(d.getMontant())
                        .build()).collect(Collectors.toList());

        return BonLivraisonDTO.builder()
                .id(bl.getId())
                .numero(bl.getNumero())
                .clientId(bl.getClient().getId())
                .clientNom(bl.getClient().getNom())
                .clientIce(bl.getClient().getIce())
                .clientTelephone(bl.getClient().getTelephone())
                .clientEmail(bl.getClient().getEmail())
                .clientAdresse(bl.getClient().getAdresse())
                .affaireId(bl.getAffaire()  != null ? bl.getAffaire().getId()  : null)
                .affaireNom(bl.getAffaire() != null ? bl.getAffaire().getNom() : null)
                .bonCommandeClientId(bl.getBonCommandeClient() != null ? bl.getBonCommandeClient().getId() : null)
                .bonCommandeClientNumero(bl.getBonCommandeClient() != null ? bl.getBonCommandeClient().getNumero() : null)
                .dateLivraison(bl.getDateLivraison())
                .statut(bl.getStatut())
                .montantHt(bl.getMontantHt())
                .tva(bl.getTva())
                .montantTtc(bl.getMontantTtc())
                .observations(bl.getObservations())
                .utilisateurId(bl.getUtilisateur() != null ? bl.getUtilisateur().getId() : null)
                .entrepriseId(bl.getEntreprise()   != null ? bl.getEntreprise().getId()  : null)
                .dateCreation(bl.getDateCreation())
                .details(details)
                .build();
    }
}