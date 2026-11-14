package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonReceptionFournisseurDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.BonReceptionFournisseurService;
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
public class BonReceptionFournisseurServiceImpl implements BonReceptionFournisseurService {

    private final BonReceptionFournisseurRepository bonReceptionFournisseurRepository;
    private final FournisseurRepository             fournisseurRepository;
    private final AffaireRepository                 affaireRepository;
    private final ArticleRepository                 articleRepository;
    private final UtilisateurRepository             utilisateurRepository;
    private final EntrepriseRepository              entrepriseRepository;
    private final BonCommandeFournisseurRepository  bonCommandeFournisseurRepository;
    private final MouvementStockRepository          mouvementStockRepository;
    private final NumeroGeneratorService            numeroGeneratorService;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BonReceptionFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BonReceptionFournisseurDTO> findAll(Integer entrepriseId,
                                                     String search,
                                                     BonReceptionFournisseur.Statut statut,
                                                     Integer fournisseurId,
                                                     LocalDate dateDebut,
                                                     LocalDate dateFin,
                                                     Pageable pageable) {

        Specification<BonReceptionFournisseur> spec = BonReceptionFournisseurSpecification.filtrer(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin);

        return bonReceptionFournisseurRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BonReceptionFournisseurDTO findById(Integer id) {
        return toDTO(bonReceptionFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de réception fournisseur", id)));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    public BonReceptionFournisseurDTO create(BonReceptionFournisseurDTO dto, String loginUtilisateur) {
        BonReceptionFournisseur br = buildBon(dto, loginUtilisateur);
        br.setNumero(numeroGeneratorService.generer("BRF", "bon_reception_fournisseur", "numero"));
        BonReceptionFournisseur saved = bonReceptionFournisseurRepository.save(br);
        enregistrerEntrees(saved, "Réception marchandises — BRF : " + saved.getNumero());

        // ✅ Mise à jour automatique : BCF → recu
        if (dto.getBonCommandeFournisseurId() != null) {
            bonCommandeFournisseurRepository.findById(dto.getBonCommandeFournisseurId()).ifPresent(bcf -> {
                bcf.setStatut(BonCommandeFournisseur.Statut.recu);
                bonCommandeFournisseurRepository.save(bcf);
            });
        }

        return toDTO(saved);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    @Override
    public BonReceptionFournisseurDTO update(Integer id, BonReceptionFournisseurDTO dto, String loginUtilisateur) {
        BonReceptionFournisseur existing = bonReceptionFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de réception fournisseur", id));

        if (existing.getStatut() != BonReceptionFournisseur.Statut.annule) {
            enregistrerSorties(existing, "Annulation modification BRF " + existing.getNumero());
        }

        BonReceptionFournisseur br = buildBon(dto, loginUtilisateur);
        br.setId(id);
        br.setNumero(existing.getNumero());
        BonReceptionFournisseur saved = bonReceptionFournisseurRepository.save(br);

        if (saved.getStatut() != BonReceptionFournisseur.Statut.annule) {
            enregistrerEntrees(saved, "Modification BRF : " + saved.getNumero());
        }

        return toDTO(saved);
    }

    // ── UPDATE STATUT ─────────────────────────────────────────────────────────

    @Override
    public BonReceptionFournisseurDTO updateStatut(Integer id, BonReceptionFournisseur.Statut statut) {
        BonReceptionFournisseur br = bonReceptionFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de réception fournisseur", id));

        BonReceptionFournisseur.Statut ancienStatut = br.getStatut();

        if (statut == BonReceptionFournisseur.Statut.annule
                && ancienStatut != BonReceptionFournisseur.Statut.annule) {
            enregistrerSorties(br, "Annulation BRF " + br.getNumero());
        }

        if (ancienStatut == BonReceptionFournisseur.Statut.annule
                && statut != BonReceptionFournisseur.Statut.annule) {
            enregistrerEntrees(br, "Réactivation BRF " + br.getNumero());
        }

        br.setStatut(statut);
        return toDTO(bonReceptionFournisseurRepository.save(br));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Override
    public void delete(Integer id) {
        BonReceptionFournisseur br = bonReceptionFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de réception fournisseur", id));

        if (br.getStatut() != BonReceptionFournisseur.Statut.annule) {
            enregistrerSorties(br, "Suppression BRF " + br.getNumero());
        }

        bonReceptionFournisseurRepository.deleteById(id);
    }

    // ── Gestion stock ─────────────────────────────────────────────────────────

    private void enregistrerEntrees(BonReceptionFournisseur br, String motif) {
        if (br.getDetails() == null) return;
        for (BonReceptionFournisseurDetail detail : br.getDetails()) {
            Article article = detail.getArticle();
            BigDecimal qte = toBigDecimal(detail.getQte());
            BigDecimal stockAvant = article.getStock() != null ? article.getStock() : BigDecimal.ZERO;
            BigDecimal stockApres = stockAvant.add(qte);
            article.setStock(stockApres);
            articleRepository.save(article);
            mouvementStockRepository.save(MouvementStock.builder()
                    .article(article)
                    .typeMouvement(MouvementStock.TypeMouvement.entree)
                    .qte(qte)
                    .stockAvant(stockAvant)
                    .stockApres(stockApres)
                    .referenceDocument(br.getNumero())
                    .bonReceptionFournisseur(br)
                    .entreprise(br.getEntreprise())
                    .observations(motif)
                    .build());
        }
    }

    private void enregistrerSorties(BonReceptionFournisseur br, String motif) {
        if (br.getDetails() == null) return;
        for (BonReceptionFournisseurDetail detail : br.getDetails()) {
            Article article = detail.getArticle();
            BigDecimal qte = toBigDecimal(detail.getQte());
            BigDecimal stockAvant = article.getStock() != null ? article.getStock() : BigDecimal.ZERO;
            BigDecimal stockApres = stockAvant.subtract(qte);
            if (stockApres.compareTo(BigDecimal.ZERO) < 0) stockApres = BigDecimal.ZERO;
            article.setStock(stockApres);
            articleRepository.save(article);
            mouvementStockRepository.save(MouvementStock.builder()
                    .article(article)
                    .typeMouvement(MouvementStock.TypeMouvement.sortie)
                    .qte(qte)
                    .stockAvant(stockAvant)
                    .stockApres(stockApres)
                    .referenceDocument(br.getNumero())
                    .bonReceptionFournisseur(br)
                    .entreprise(br.getEntreprise())
                    .observations(motif)
                    .build());
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Integer i)    return BigDecimal.valueOf(i);
        if (value instanceof Long l)       return BigDecimal.valueOf(l);
        if (value instanceof Double d)     return BigDecimal.valueOf(d);
        return new BigDecimal(value.toString());
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private BonReceptionFournisseur buildBon(BonReceptionFournisseurDTO dto, String loginUtilisateur) {
        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseurId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", dto.getFournisseurId()));
        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur).orElseThrow();

        BonReceptionFournisseur br = new BonReceptionFournisseur();
        br.setFournisseur(fournisseur);
        br.setDateReception(dto.getDateReception());
        br.setStatut(dto.getStatut() != null ? dto.getStatut() : BonReceptionFournisseur.Statut.en_cours);
        br.setObservations(dto.getObservations());
        br.setUtilisateur(user);

        if (dto.getAffaireId() != null)
            affaireRepository.findById(dto.getAffaireId()).ifPresent(br::setAffaire);
        if (dto.getBonCommandeFournisseurId() != null)
            bonCommandeFournisseurRepository.findById(dto.getBonCommandeFournisseurId())
                    .ifPresent(br::setBonCommandeFournisseur);
        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(br::setEntreprise);

        List<BonReceptionFournisseurDetail> details = new ArrayList<>();
        if (dto.getDetails() != null) {
            for (BonReceptionFournisseurDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
                BigDecimal qte = toBigDecimal(d.getQte());
                BigDecimal montant = d.getPrixUnitaire().multiply(qte);
                details.add(BonReceptionFournisseurDetail.builder()
                        .bonReceptionFournisseur(br)
                        .article(article)
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(montant)
                        .build());
            }
        }
        br.setDetails(details);
        return br;
    }

    // ── Mapping DTO ──────────────────────────────────────────────────────────

    private BonReceptionFournisseurDTO toDTO(BonReceptionFournisseur br) {
        List<BonReceptionFournisseurDTO.DetailDTO> details = br.getDetails() == null ? List.of() :
                br.getDetails().stream().map(d -> BonReceptionFournisseurDTO.DetailDTO.builder()
                        .id(d.getId())
                        .articleId(d.getArticle().getId())
                        .articleCode(d.getArticle().getCode())
                        .articleDesignation(d.getArticle().getDesignation())
                        .articleUnite(d.getArticle().getUnite())
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(d.getMontant())
                        .build()).collect(Collectors.toList());

        return BonReceptionFournisseurDTO.builder()
                .id(br.getId())
                .numero(br.getNumero())
                .fournisseurId(br.getFournisseur().getId())
                .fournisseurIce(br.getFournisseur().getIce())
                .fournisseurNom(br.getFournisseur().getNom())
                .fournisseurTelephone(br.getFournisseur().getTelephone())
                .fournisseurEmail(br.getFournisseur().getEmail())
                .fournisseurAdresse(br.getFournisseur().getAdresse())
                .affaireId(br.getAffaire() != null ? br.getAffaire().getId() : null)
                .affaireNom(br.getAffaire() != null ? br.getAffaire().getNom() : null)
                .bonCommandeFournisseurId(br.getBonCommandeFournisseur() != null
                        ? br.getBonCommandeFournisseur().getId() : null)
                .bonCommandeFournisseurNumero(br.getBonCommandeFournisseur() != null
                        ? br.getBonCommandeFournisseur().getNumero() : null)
                .dateReception(br.getDateReception())
                .statut(br.getStatut())
                .observations(br.getObservations())
                .utilisateurId(br.getUtilisateur() != null ? br.getUtilisateur().getId() : null)
                .entrepriseId(br.getEntreprise() != null ? br.getEntreprise().getId() : null)
                .dateCreation(br.getDateCreation())
                .details(details)
                .build();
    }
}