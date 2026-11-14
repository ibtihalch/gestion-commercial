package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.FactureFournisseurDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.FactureFournisseurService;
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
public class FactureFournisseurServiceImpl implements FactureFournisseurService {

    private final FactureFournisseurRepository      factureFournisseurRepository;
    private final FournisseurRepository             fournisseurRepository;
    private final AffaireRepository                 affaireRepository;
    private final ArticleRepository                 articleRepository;
    private final UtilisateurRepository             utilisateurRepository;
    private final EntrepriseRepository              entrepriseRepository;
    private final BonReceptionFournisseurRepository bonReceptionFournisseurRepository;
    private final NumeroGeneratorService            numeroGeneratorService;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<FactureFournisseurDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FactureFournisseurDTO> findAll(Integer entrepriseId,
                                               String search,
                                               FactureFournisseur.Statut statut,
                                               Integer fournisseurId,
                                               LocalDate dateDebut,
                                               LocalDate dateFin,
                                               Pageable pageable) {

        Specification<FactureFournisseur> spec = FactureFournisseurSpecification.filtrer(
                entrepriseId, search, statut, fournisseurId, dateDebut, dateFin);

        return factureFournisseurRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public FactureFournisseurDTO findById(Integer id) {
        return toDTO(factureFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", id)));
    }

    // ── Écriture ─────────────────────────────────────────────────────────────

    @Override
    public FactureFournisseurDTO create(FactureFournisseurDTO dto, String loginUtilisateur) {
        FactureFournisseur f = buildFacture(new FactureFournisseur(), dto, loginUtilisateur);
        f.setNumero(numeroGeneratorService.generer("FF", "facture_fournisseur", "numero"));
        FactureFournisseur saved = factureFournisseurRepository.save(f);

        // ✅ Mise à jour automatique : BRF → facture (= reçu + facturé)
        if (dto.getBonReceptionFournisseurId() != null) {
            bonReceptionFournisseurRepository.findById(dto.getBonReceptionFournisseurId()).ifPresent(brf -> {
                brf.setStatut(BonReceptionFournisseur.Statut.facture);
                bonReceptionFournisseurRepository.save(brf);
            });
        }

        return toDTO(saved);
    }

    @Override
    public FactureFournisseurDTO update(Integer id, FactureFournisseurDTO dto, String loginUtilisateur) {
        FactureFournisseur existing = factureFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", id));
        buildFacture(existing, dto, loginUtilisateur);
        return toDTO(factureFournisseurRepository.save(existing));
    }

    @Override
    public FactureFournisseurDTO updateStatut(Integer id, FactureFournisseur.Statut statut) {
        FactureFournisseur f = factureFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", id));
        f.setStatut(statut);
        return toDTO(factureFournisseurRepository.save(f));
    }

    @Override
    public void delete(Integer id) {
        factureFournisseurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", id));
        factureFournisseurRepository.deleteById(id);
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private FactureFournisseur buildFacture(FactureFournisseur f,
                                             FactureFournisseurDTO dto,
                                             String loginUtilisateur) {

        Fournisseur fournisseur = fournisseurRepository.findById(dto.getFournisseurId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur", dto.getFournisseurId()));
        f.setFournisseur(fournisseur);

        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));
        f.setUtilisateur(user);

        f.setDateFacture(dto.getDateFacture());
        f.setDateEcheance(dto.getDateEcheance());
        f.setStatut(dto.getStatut() != null ? dto.getStatut() : FactureFournisseur.Statut.impayee);
        f.setObservations(dto.getObservations());

        if (dto.getAffaireId() != null) {
            affaireRepository.findById(dto.getAffaireId()).ifPresent(f::setAffaire);
        } else {
            f.setAffaire(null);
        }

        if (dto.getBonReceptionFournisseurId() != null) {
            bonReceptionFournisseurRepository.findById(dto.getBonReceptionFournisseurId())
                    .ifPresent(f::setBonReceptionFournisseur);
        } else {
            f.setBonReceptionFournisseur(null);
        }

        if (dto.getEntrepriseId() != null) {
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(f::setEntreprise);
        }

        List<FactureFournisseurDetail> details = new ArrayList<>();
        BigDecimal totalHt = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (FactureFournisseurDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));

                BigDecimal montant = d.getPrixUnitaire().multiply(BigDecimal.valueOf(d.getQte()));

                details.add(FactureFournisseurDetail.builder()
                        .factureFournisseur(f)
                        .article(article)
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(montant)
                        .build());

                totalHt = totalHt.add(montant);
            }
        }

        BigDecimal tva = totalHt.multiply(new BigDecimal("0.20"));
        f.setMontantHt(totalHt);
        f.setTva(tva);
        f.setMontantTtc(totalHt.add(tva));

        if (f.getDetails() == null) {
            f.setDetails(details);
        } else {
            f.getDetails().clear();
            f.getDetails().addAll(details);
        }

        return f;
    }

    // ── Mapping DTO ──────────────────────────────────────────────────────────

    private FactureFournisseurDTO toDTO(FactureFournisseur f) {
        List<FactureFournisseurDTO.DetailDTO> details = f.getDetails() == null ? List.of() :
                f.getDetails().stream().map(d -> FactureFournisseurDTO.DetailDTO.builder()
                        .id(d.getId())
                        .articleId(d.getArticle().getId())
                        .articleCode(d.getArticle().getCode())
                        .articleDesignation(d.getArticle().getDesignation())
                        .articleUnite(d.getArticle().getUnite())
                        .qte(d.getQte())
                        .prixUnitaire(d.getPrixUnitaire())
                        .montant(d.getMontant())
                        .build())
                .collect(Collectors.toList());

        return FactureFournisseurDTO.builder()
                .id(f.getId())
                .numero(f.getNumero())
                .fournisseurId(f.getFournisseur().getId())
                .fournisseurNom(f.getFournisseur().getNom())
                .fournisseurIce(f.getFournisseur().getIce())
                .fournisseurTelephone(f.getFournisseur().getTelephone())
                .fournisseurEmail(f.getFournisseur().getEmail())
                .fournisseurAdresse(f.getFournisseur().getAdresse())
                .affaireId(f.getAffaire()  != null ? f.getAffaire().getId()  : null)
                .affaireNom(f.getAffaire() != null ? f.getAffaire().getNom() : null)
                .bonReceptionFournisseurId(f.getBonReceptionFournisseur() != null
                        ? f.getBonReceptionFournisseur().getId() : null)
                .bonReceptionFournisseurNumero(f.getBonReceptionFournisseur() != null
                        ? f.getBonReceptionFournisseur().getNumero() : null)
                .dateFacture(f.getDateFacture())
                .dateEcheance(f.getDateEcheance())
                .statut(f.getStatut())
                .montantHt(f.getMontantHt())
                .tva(f.getTva())
                .montantTtc(f.getMontantTtc())
                .observations(f.getObservations())
                .entrepriseId(f.getEntreprise() != null ? f.getEntreprise().getId() : null)
                .dateCreation(f.getDateCreation())
                .details(details)
                .build();
    }
}