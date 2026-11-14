package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonCommandeFournisseurDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.BonCommandeFournisseurService;
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
public class BonCommandeFournisseurServiceImpl implements BonCommandeFournisseurService {

    private final BonCommandeFournisseurRepository bonCommandeFournisseurRepository;
    private final FournisseurRepository            fournisseurRepository;
    private final AffaireRepository                affaireRepository;
    private final ArticleRepository                articleRepository;
    private final UtilisateurRepository            utilisateurRepository;
    private final EntrepriseRepository             entrepriseRepository;
    private final NumeroGeneratorService           numeroGeneratorService;

    @Override
    @Transactional(readOnly = true)
    public Page<BonCommandeFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BonCommandeFournisseurDTO> findAll(Integer entrepriseId,
                                                    String search,
                                                    BonCommandeFournisseur.Statut statut,
                                                    Integer fournisseurId,
                                                    LocalDate dateDebut,
                                                    LocalDate dateFin,
                                                    Pageable pageable) {

        Specification<BonCommandeFournisseur> spec = BonCommandeFournisseurSpecification.filtrer(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin);

        return bonCommandeFournisseurRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BonCommandeFournisseurDTO findById(Integer id) {
        return toDTO(bonCommandeFournisseurRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande fournisseur", id)));
    }

    @Override
    public BonCommandeFournisseurDTO create(BonCommandeFournisseurDTO dto, String loginUtilisateur) {
        BonCommandeFournisseur bc = buildBon(dto, loginUtilisateur);
        bc.setNumero(numeroGeneratorService.generer("BCF", "bon_commande_fournisseur", "numero"));
        return toDTO(bonCommandeFournisseurRepository.save(bc));
    }

    @Override
    public BonCommandeFournisseurDTO update(Integer id, BonCommandeFournisseurDTO dto, String loginUtilisateur) {
        BonCommandeFournisseur existing = bonCommandeFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande fournisseur", id));
        BonCommandeFournisseur bc = buildBon(dto, loginUtilisateur);
        bc.setId(id);
        bc.setNumero(existing.getNumero());
        return toDTO(bonCommandeFournisseurRepository.save(bc));
    }

    @Override
    public BonCommandeFournisseurDTO updateStatut(Integer id, BonCommandeFournisseur.Statut statut) {
        BonCommandeFournisseur bc = bonCommandeFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande fournisseur", id));
        bc.setStatut(statut);
        return toDTO(bonCommandeFournisseurRepository.save(bc));
    }

    @Override
    public void delete(Integer id) {
        bonCommandeFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande fournisseur", id));
        bonCommandeFournisseurRepository.deleteById(id);
    }

    // ── Builder interne ───────────────────────────────────────────────────────

    private BonCommandeFournisseur buildBon(BonCommandeFournisseurDTO dto, String loginUtilisateur) {
        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseurId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", dto.getFournisseurId()));
        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur).orElseThrow();

        BonCommandeFournisseur bc = new BonCommandeFournisseur();
        bc.setFournisseur(fournisseur);
        bc.setDateCommande(dto.getDateCommande());
        bc.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        bc.setStatut(dto.getStatut() != null ? dto.getStatut() : BonCommandeFournisseur.Statut.en_cours);
        bc.setObservations(dto.getObservations());
        bc.setConditionsPaiement(dto.getConditionsPaiement());
        bc.setUtilisateur(user);

        if (dto.getAffaireId() != null)
            affaireRepository.findById(dto.getAffaireId()).ifPresent(bc::setAffaire);
        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(bc::setEntreprise);

        List<BonCommandeFournisseurDetail> details = new ArrayList<>();
        BigDecimal totalHt = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (BonCommandeFournisseurDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
                BigDecimal montant = d.getPrixUnitaire().multiply(BigDecimal.valueOf(d.getQte()));
                details.add(BonCommandeFournisseurDetail.builder()
                        .bonCommandeFournisseur(bc)
                        .article(article)
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(montant)
                        .build());
                totalHt = totalHt.add(montant);
            }
        }

        BigDecimal tva = totalHt.multiply(BigDecimal.valueOf(0.20));
        bc.setMontantHt(totalHt);
        bc.setTva(tva);
        bc.setMontantTtc(totalHt.add(tva));
        bc.setDetails(details);
        return bc;
    }

    // ── Mapping DTO ───────────────────────────────────────────────────────────

    private BonCommandeFournisseurDTO toDTO(BonCommandeFournisseur bc) {
        List<BonCommandeFournisseurDTO.DetailDTO> details = bc.getDetails() == null ? List.of() :
                bc.getDetails().stream().map(d -> BonCommandeFournisseurDTO.DetailDTO.builder()
                        .id(d.getId())
                        .articleId(d.getArticle().getId())
                        .articleCode(d.getArticle().getCode())
                        .articleDesignation(d.getArticle().getDesignation())
                        .articleUnite(d.getArticle().getUnite())
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(d.getMontant())
                        .build()).collect(Collectors.toList());

        return BonCommandeFournisseurDTO.builder()
                .id(bc.getId())
                .numero(bc.getNumero())
                .fournisseurId(bc.getFournisseur().getId())
                .fournisseurNom(bc.getFournisseur().getNom())
                .fournisseurIce(bc.getFournisseur().getIce())
                .fournisseurTelephone(bc.getFournisseur().getTelephone())
                .fournisseurEmail(bc.getFournisseur().getEmail())
                .fournisseurAdresse(bc.getFournisseur().getAdresse())
                .affaireId(bc.getAffaire()  != null ? bc.getAffaire().getId()  : null)
                .affaireNom(bc.getAffaire() != null ? bc.getAffaire().getNom() : null)
                .dateCommande(bc.getDateCommande())
                .dateLivraisonPrevue(bc.getDateLivraisonPrevue())
                .statut(bc.getStatut())
                .montantHt(bc.getMontantHt())
                .tva(bc.getTva())
                .montantTtc(bc.getMontantTtc())
                .observations(bc.getObservations())
                .conditionsPaiement(bc.getConditionsPaiement())
                .utilisateurId(bc.getUtilisateur() != null ? bc.getUtilisateur().getId() : null)
                .entrepriseId(bc.getEntreprise()   != null ? bc.getEntreprise().getId()  : null)
                .dateCreation(bc.getDateCreation())
                .details(details)
                .build();
    }
}