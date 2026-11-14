package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonCommandeClientDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.BonCommandeClientService;
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
public class BonCommandeClientServiceImpl implements BonCommandeClientService {

    private final BonCommandeClientRepository bonCommandeClientRepository;
    private final ClientRepository            clientRepository;
    private final AffaireRepository           affaireRepository;
    private final ArticleRepository           articleRepository;
    private final UtilisateurRepository       utilisateurRepository;
    private final EntrepriseRepository        entrepriseRepository;
    private final NumeroGeneratorService      numeroGeneratorService;
    // ✅ NOUVEAU
    private final DevisRepository             devisRepository;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BonCommandeClientDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BonCommandeClientDTO> findAll(Integer entrepriseId,
                                               String search,
                                               BonCommandeClient.Statut statut,
                                               Integer clientId,
                                               LocalDate dateDebut,
                                               LocalDate dateFin,
                                               Pageable pageable) {

        Specification<BonCommandeClient> spec = BonCommandeClientSpecification.filtrer(
                entrepriseId, search, statut, clientId, dateDebut, dateFin);

        return bonCommandeClientRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BonCommandeClientDTO findById(Integer id) {
        return toDTO(bonCommandeClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande client", id)));
    }

    // ── Écriture ─────────────────────────────────────────────────────────────

    @Override
    public BonCommandeClientDTO create(BonCommandeClientDTO dto, String loginUtilisateur) {
        BonCommandeClient bc = buildBon(dto, loginUtilisateur);
        bc.setNumero(numeroGeneratorService.generer("BCC", "bon_commande_client", "numero"));
        BonCommandeClient saved = bonCommandeClientRepository.save(bc);

        // ✅ Mise à jour automatique : Devis → accepte
        if (dto.getDevisId() != null) {
            devisRepository.findById(dto.getDevisId()).ifPresent(devis -> {
                devis.setStatut(Devis.StatutDevis.accepte);
                devisRepository.save(devis);
            });
        }

        return toDTO(saved);
    }

    @Override
    public BonCommandeClientDTO update(Integer id, BonCommandeClientDTO dto, String loginUtilisateur) {
        BonCommandeClient existing = bonCommandeClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande client", id));
        BonCommandeClient bc = buildBon(dto, loginUtilisateur);
        bc.setId(id);
        bc.setNumero(existing.getNumero());
        return toDTO(bonCommandeClientRepository.save(bc));
    }

    @Override
    public BonCommandeClientDTO updateStatut(Integer id, BonCommandeClient.Statut statut) {
        BonCommandeClient bc = bonCommandeClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande client", id));
        bc.setStatut(statut);
        return toDTO(bonCommandeClientRepository.save(bc));
    }

    @Override
    public void delete(Integer id) {
        bonCommandeClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon commande client", id));
        bonCommandeClientRepository.deleteById(id);
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private BonCommandeClient buildBon(BonCommandeClientDTO dto, String loginUtilisateur) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", dto.getClientId()));
        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));

        BonCommandeClient bc = new BonCommandeClient();
        bc.setClient(client);
        bc.setDateCommande(dto.getDateCommande());
        bc.setDateLivraisonPrevue(dto.getDateLivraisonPrevue());
        bc.setStatut(dto.getStatut() != null ? dto.getStatut() : BonCommandeClient.Statut.en_cours);
        bc.setObservations(dto.getObservations());
        bc.setConditionsPaiement(dto.getConditionsPaiement());
        bc.setUtilisateur(user);

        if (dto.getAffaireId() != null)
            affaireRepository.findById(dto.getAffaireId()).ifPresent(bc::setAffaire);
        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(bc::setEntreprise);

        // ✅ NOUVEAU — lier le devis source
        if (dto.getDevisId() != null)
            devisRepository.findById(dto.getDevisId()).ifPresent(bc::setDevis);

        List<BonCommandeClientDetail> details = new ArrayList<>();
        BigDecimal totalHt = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (BonCommandeClientDTO.DetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
                BigDecimal montant = d.getPrixUnitaire().multiply(d.getQte());
                details.add(BonCommandeClientDetail.builder()
                        .bonCommandeClient(bc).article(article)
                        .qte(d.getQte()).prixUnitaire(d.getPrixUnitaire()).montant(montant)
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

    // ── Mapping DTO ──────────────────────────────────────────────────────────

    private BonCommandeClientDTO toDTO(BonCommandeClient bc) {
        List<BonCommandeClientDTO.DetailDTO> details = bc.getDetails() == null ? List.of() :
                bc.getDetails().stream().map(d -> BonCommandeClientDTO.DetailDTO.builder()
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

        return BonCommandeClientDTO.builder()
                .id(bc.getId())
                .numero(bc.getNumero())
                .clientId(bc.getClient().getId())
                .clientNom(bc.getClient().getNom())
                .clientIce(bc.getClient().getIce())
                .clientTelephone(bc.getClient().getTelephone())
                .clientEmail(bc.getClient().getEmail())
                .clientAdresse(bc.getClient().getAdresse())
                .affaireId(bc.getAffaire()  != null ? bc.getAffaire().getId()  : null)
                .affaireNom(bc.getAffaire() != null ? bc.getAffaire().getNom() : null)
                // ✅ NOUVEAU
                .devisId(bc.getDevis()     != null ? bc.getDevis().getId()     : null)
                .devisNumero(bc.getDevis() != null ? bc.getDevis().getNumero() : null)
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