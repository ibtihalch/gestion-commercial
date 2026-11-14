package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.FactureClientDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.FactureClientService;
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
public class FactureClientServiceImpl implements FactureClientService {

    private final FactureClientRepository factureClientRepository;
    private final ClientRepository        clientRepository;
    private final AffaireRepository       affaireRepository;
    private final ArticleRepository       articleRepository;
    private final UtilisateurRepository   utilisateurRepository;
    private final EntrepriseRepository    entrepriseRepository;
    private final BonLivraisonRepository  bonLivraisonRepository;
    private final NumeroGeneratorService  numeroGeneratorService;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<FactureClientDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FactureClientDTO> findAll(Integer entrepriseId,
                                          String search,
                                          FactureClient.Statut statut,
                                          Integer clientId,
                                          LocalDate dateDebut,
                                          LocalDate dateFin,
                                          Pageable pageable) {

        Specification<FactureClient> spec = FactureClientSpecification.filtrer(
                entrepriseId, search, statut, clientId, dateDebut, dateFin);

        return factureClientRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public FactureClientDTO findById(Integer id) {
        return toDTO(factureClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", id)));
    }

    // ── Écriture ─────────────────────────────────────────────────────────────

    @Override
    public FactureClientDTO create(FactureClientDTO dto, String loginUtilisateur) {
        FactureClient f = buildFacture(new FactureClient(), dto, loginUtilisateur);
        f.setNumero(numeroGeneratorService.generer("FC", "facture_client", "numero"));
        FactureClient saved = factureClientRepository.save(f);

        // ✅ Mise à jour automatique : BL → facture
        if (dto.getBonLivraisonId() != null) {
            bonLivraisonRepository.findById(dto.getBonLivraisonId()).ifPresent(bl -> {
                bl.setStatut(BonLivraison.Statut.facture);
                bonLivraisonRepository.save(bl);
            });
        }

        return toDTO(saved);
    }

    @Override
    public FactureClientDTO update(Integer id, FactureClientDTO dto, String loginUtilisateur) {
        FactureClient existing = factureClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", id));
        buildFacture(existing, dto, loginUtilisateur);
        return toDTO(factureClientRepository.save(existing));
    }

    @Override
    public FactureClientDTO updateStatut(Integer id, FactureClient.Statut statut) {
        FactureClient f = factureClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", id));
        f.setStatut(statut);
        return toDTO(factureClientRepository.save(f));
    }

    @Override
    public void delete(Integer id) {
        factureClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", id));
        factureClientRepository.deleteById(id);
    }

    // ── Statistiques ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public BigDecimal sumImpayees(Integer entrepriseId) {
        BigDecimal v = factureClientRepository.sumImpayeesByEntrepriseId(entrepriseId);
        return v != null ? v : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal sumPayees(Integer entrepriseId) {
        BigDecimal v = factureClientRepository.sumPayeesByEntrepriseId(entrepriseId);
        return v != null ? v : BigDecimal.ZERO;
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private FactureClient buildFacture(FactureClient f,
                                       FactureClientDTO dto,
                                       String loginUtilisateur) {

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", dto.getClientId()));
        f.setClient(client);

        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));
        f.setUtilisateur(user);

        f.setDateFacture(dto.getDateFacture());
        f.setDateEcheance(dto.getDateEcheance());
        f.setStatut(dto.getStatut() != null ? dto.getStatut() : FactureClient.Statut.impayee);
        f.setObservations(dto.getObservations());

        if (dto.getAffaireId() != null) {
            affaireRepository.findById(dto.getAffaireId()).ifPresent(f::setAffaire);
        } else {
            f.setAffaire(null);
        }

        if (dto.getBonLivraisonId() != null) {
            bonLivraisonRepository.findById(dto.getBonLivraisonId()).ifPresent(f::setBonLivraison);
        } else {
            f.setBonLivraison(null);
        }

        if (dto.getEntrepriseId() != null) {
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(f::setEntreprise);
        }

        List<FactureClientDetail> details = new ArrayList<>();
        BigDecimal totalHt = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (FactureClientDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));

                BigDecimal qte     = BigDecimal.valueOf(d.getQte());
                BigDecimal montant = d.getPrixUnitaire().multiply(qte);

                details.add(FactureClientDetail.builder()
                        .factureClient(f)
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

    private FactureClientDTO toDTO(FactureClient f) {
        List<FactureClientDTO.DetailDTO> details = f.getDetails() == null ? List.of() :
                f.getDetails().stream().map(d -> FactureClientDTO.DetailDTO.builder()
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

        return FactureClientDTO.builder()
                .id(f.getId())
                .numero(f.getNumero())
                .clientId(f.getClient().getId())
                .clientIce(f.getClient().getIce())
                .clientNom(f.getClient().getNom())
                .clientTelephone(f.getClient().getTelephone())
                .clientEmail(f.getClient().getEmail())
                .clientAdresse(f.getClient().getAdresse())
                .affaireId(f.getAffaire()           != null ? f.getAffaire().getId()           : null)
                .affaireNom(f.getAffaire()          != null ? f.getAffaire().getNom()           : null)
                .bonLivraisonId(f.getBonLivraison() != null ? f.getBonLivraison().getId()       : null)
                .bonLivraisonNumero(f.getBonLivraison() != null ? f.getBonLivraison().getNumero() : null)
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