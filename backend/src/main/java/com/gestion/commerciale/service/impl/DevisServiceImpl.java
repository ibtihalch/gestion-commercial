package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.DevisDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.DevisService;
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
public class DevisServiceImpl implements DevisService {

    private final DevisRepository        devisRepository;
    private final ClientRepository       clientRepository;
    private final AffaireRepository      affaireRepository;
    private final ArticleRepository      articleRepository;
    private final UtilisateurRepository  utilisateurRepository;
    private final EntrepriseRepository   entrepriseRepository;
    private final NumeroGeneratorService numeroGeneratorService;

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<DevisDTO> findAll(Integer entrepriseId, Pageable pageable) {
        return findAll(entrepriseId, null, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DevisDTO> findAll(Integer entrepriseId,
                                  String search,
                                  Devis.StatutDevis statut,
                                  Integer clientId,
                                  LocalDate dateDebut,
                                  LocalDate dateFin,
                                  Pageable pageable) {

        Specification<Devis> spec = DevisSpecification.filtrer(
                entrepriseId, search, statut, clientId, dateDebut, dateFin);

        return devisRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public DevisDTO findById(Integer id) {
        return toDTO(devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis", id)));
    }

    // ── Écriture ─────────────────────────────────────────────────────────────

    @Override
    public DevisDTO create(DevisDTO dto, String loginUtilisateur) {
        Devis devis = buildDevis(dto, loginUtilisateur);
        devis.setNumero(numeroGeneratorService.generer("DEV", "devis", "numero"));
        return toDTO(devisRepository.save(devis));
    }

    @Override
    public DevisDTO update(Integer id, DevisDTO dto, String loginUtilisateur) {
        Devis existing = devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis", id));
        Devis devis = buildDevis(dto, loginUtilisateur);
        devis.setId(id);
        devis.setNumero(existing.getNumero());
        return toDTO(devisRepository.save(devis));
    }

    @Override
    public DevisDTO updateStatut(Integer id, Devis.StatutDevis statut) {
        Devis d = devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis", id));
        d.setStatut(statut);
        return toDTO(devisRepository.save(d));
    }

    @Override
    public void delete(Integer id) {
        devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis", id));
        devisRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long count(Integer entrepriseId) {
        return entrepriseId != null
                ? devisRepository.countByEntrepriseId(entrepriseId)
                : devisRepository.count();
    }

    // ✅ NOUVEAU — passe le devis en "accepte"
    @Override
    public void accepter(Integer devisId) {
        Devis d = devisRepository.findById(devisId)
                .orElseThrow(() -> new ResourceNotFoundException("Devis", devisId));
        d.setStatut(Devis.StatutDevis.accepte);
        devisRepository.save(d);
    }

    // ── Builder interne ──────────────────────────────────────────────────────

    private Devis buildDevis(DevisDTO dto, String loginUtilisateur) {

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", dto.getClientId()));

        Utilisateur user = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));

        Devis devis = new Devis();
        devis.setClient(client);
        devis.setDateDevis(dto.getDateDevis());
        devis.setDateValidite(dto.getDateValidite());
        devis.setStatut(dto.getStatut() != null ? dto.getStatut() : Devis.StatutDevis.brouillon);
        devis.setObservations(dto.getObservations());
        devis.setConditionsPaiement(dto.getConditionsPaiement());
        devis.setUtilisateur(user);

        if (dto.getAffaireId() != null)
            affaireRepository.findById(dto.getAffaireId()).ifPresent(devis::setAffaire);
        if (dto.getEntrepriseId() != null)
            entrepriseRepository.findById(dto.getEntrepriseId()).ifPresent(devis::setEntreprise);

        List<DevisDetail> details  = new ArrayList<>();
        BigDecimal        totalHt  = BigDecimal.ZERO;

        if (dto.getDetails() != null) {
            for (DevisDTO.DevisDetailDTO d : dto.getDetails()) {
                Article article = articleRepository.findById(d.getArticleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Article", d.getArticleId()));
                BigDecimal montant = d.getPrixUnitaire().multiply(BigDecimal.valueOf(d.getQte()));
                details.add(DevisDetail.builder()
                        .devis(devis).article(article)
                        .qte(d.getQte()).prixUnitaire(d.getPrixUnitaire()).montant(montant)
                        .build());
                totalHt = totalHt.add(montant);
            }
        }

        BigDecimal tva = totalHt.multiply(BigDecimal.valueOf(0.20));
        devis.setMontantHt(totalHt);
        devis.setTva(tva);
        devis.setMontantTtc(totalHt.add(tva));
        devis.setDetails(details);
        return devis;
    }

    // ── Mapping DTO ──────────────────────────────────────────────────────────

    private DevisDTO toDTO(Devis d) {

        List<DevisDTO.DevisDetailDTO> details = d.getDetails() == null ? List.of() :
                d.getDetails().stream().map(det -> DevisDTO.DevisDetailDTO.builder()
                        .id(det.getId())
                        .articleId(det.getArticle().getId())
                        .articleCode(det.getArticle().getCode())
                        .articleDesignation(det.getArticle().getDesignation())
                        .articleUnite(det.getArticle().getUnite())
                        .qte(det.getQte())
                        .prixUnitaire(det.getPrixUnitaire())
                        .montant(det.getMontant())
                        .build())
                .collect(Collectors.toList());

        return DevisDTO.builder()
                .id(d.getId())
                .numero(d.getNumero())
                .clientId(d.getClient().getId())
                .clientNom(d.getClient().getNom())
                .clientIce(d.getClient().getIce())
                .clientTelephone(d.getClient().getTelephone())
                .clientEmail(d.getClient().getEmail())
                .clientAdresse(d.getClient().getAdresse())
                .affaireId(d.getAffaire()  != null ? d.getAffaire().getId()  : null)
                .affaireNom(d.getAffaire() != null ? d.getAffaire().getNom() : null)
                .dateDevis(d.getDateDevis())
                .dateValidite(d.getDateValidite())
                .statut(d.getStatut())
                .montantHt(d.getMontantHt())
                .tva(d.getTva())
                .montantTtc(d.getMontantTtc())
                .observations(d.getObservations())
                .conditionsPaiement(d.getConditionsPaiement())
                .utilisateurId(d.getUtilisateur() != null ? d.getUtilisateur().getId() : null)
                .entrepriseId(d.getEntreprise()   != null ? d.getEntreprise().getId()  : null)
                .dateCreation(d.getDateCreation())
                .details(details)
                .build();
    }
}