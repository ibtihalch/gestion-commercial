package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.PaiementDTO;
import com.gestion.commerciale.entity.*;
import com.gestion.commerciale.exception.BadRequestException;
import com.gestion.commerciale.exception.ResourceNotFoundException;
import com.gestion.commerciale.repository.*;
import com.gestion.commerciale.service.PaiementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaiementServiceImpl implements PaiementService {

    private final PaiementRepository            paiementRepository;
    private final FactureClientRepository       factureClientRepository;
    private final FactureFournisseurRepository  factureFournisseurRepository;
    private final UtilisateurRepository         utilisateurRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // FACTURE CLIENT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public PaiementDTO payerFactureClient(Integer factureClientId,
                                          PaiementDTO dto,
                                          String loginUtilisateur) {

        // 1. Charger la facture
        FactureClient facture = factureClientRepository.findById(factureClientId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", factureClientId));

        // 2. Vérifier que la facture n'est pas déjà annulée
        if (facture.getStatut() == FactureClient.Statut.annulee) {
            throw new BadRequestException("Impossible de payer une facture annulée.");
        }

        // 3. Vérifier que la facture n'est pas déjà totalement payée
        if (facture.getStatut() == FactureClient.Statut.payee) {
            throw new BadRequestException("Cette facture est déjà marquée comme payée.");
        }

        // 4. Charger l'utilisateur qui valide
        Utilisateur valideur = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));

        // 5. Construire et sauvegarder le paiement
        Paiement paiement = Paiement.builder()
                .factureClient(facture)
                .datePaiement(dto.getDatePaiement())
                .modePaiement(dto.getModePaiement())
                .montant(dto.getMontant())
                .reference(dto.getReference())
                .remarque(dto.getRemarque())
                .validePar(valideur)
                .build();

        paiement = paiementRepository.save(paiement);

        // 6. Calculer le total déjà payé et mettre à jour le statut
        BigDecimal totalPaye = paiementRepository.sumMontantByFactureClientId(factureClientId);
        if (totalPaye.compareTo(facture.getMontantTtc()) >= 0) {
            facture.setStatut(FactureClient.Statut.payee);
            factureClientRepository.save(facture);
        }

        return toDTO(paiement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaiementDTO> getHistoriqueFactureClient(Integer factureClientId) {
        factureClientRepository.findById(factureClientId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client", factureClientId));

        return paiementRepository
                .findByFactureClientIdOrderByDatePaiementDesc(factureClientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FACTURE FOURNISSEUR
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public PaiementDTO payerFactureFournisseur(Integer factureFournisseurId,
                                               PaiementDTO dto,
                                               String loginUtilisateur) {

        // 1. Charger la facture
        FactureFournisseur facture = factureFournisseurRepository.findById(factureFournisseurId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", factureFournisseurId));

        // 2. Vérifications statut
        if (facture.getStatut() == FactureFournisseur.Statut.annulee) {
            throw new BadRequestException("Impossible de payer une facture annulée.");
        }

        if (facture.getStatut() == FactureFournisseur.Statut.payee) {
            throw new BadRequestException("Cette facture est déjà marquée comme payée.");
        }

        // 3. Charger l'utilisateur qui valide
        Utilisateur valideur = utilisateurRepository.findByLogin(loginUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + loginUtilisateur));

        // 4. Construire et sauvegarder le paiement
        Paiement paiement = Paiement.builder()
                .factureFournisseur(facture)
                .datePaiement(dto.getDatePaiement())
                .modePaiement(dto.getModePaiement())
                .montant(dto.getMontant())
                .reference(dto.getReference())
                .remarque(dto.getRemarque())
                .validePar(valideur)
                .build();

        paiement = paiementRepository.save(paiement);

        // 5. Calculer le total déjà payé et mettre à jour le statut
        BigDecimal totalPaye = paiementRepository.sumMontantByFactureFournisseurId(factureFournisseurId);
        if (totalPaye.compareTo(facture.getMontantTtc()) >= 0) {
            facture.setStatut(FactureFournisseur.Statut.payee);
            factureFournisseurRepository.save(facture);
        }

        return toDTO(paiement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaiementDTO> getHistoriqueFactureFournisseur(Integer factureFournisseurId) {
        factureFournisseurRepository.findById(factureFournisseurId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur", factureFournisseurId));

        return paiementRepository
                .findByFactureFournisseurIdOrderByDatePaiementDesc(factureFournisseurId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAPPING
    // ─────────────────────────────────────────────────────────────────────────

    private PaiementDTO toDTO(Paiement p) {
        return PaiementDTO.builder()
                .id(p.getId())
                // Facture client
                .factureClientId(p.getFactureClient() != null
                        ? p.getFactureClient().getId() : null)
                .factureClientNumero(p.getFactureClient() != null
                        ? p.getFactureClient().getNumero() : null)
                // Facture fournisseur
                .factureFournisseurId(p.getFactureFournisseur() != null
                        ? p.getFactureFournisseur().getId() : null)
                .factureFournisseurNumero(p.getFactureFournisseur() != null
                        ? p.getFactureFournisseur().getNumero() : null)
                // Données paiement
                .datePaiement(p.getDatePaiement())
                .modePaiement(p.getModePaiement())
                .montant(p.getMontant())
                .reference(p.getReference())
                .remarque(p.getRemarque())
                // Traçabilité
                .valideParId(p.getValidePar() != null ? p.getValidePar().getId() : null)
                .valideParLogin(p.getValidePar() != null ? p.getValidePar().getLogin() : null)
                .valideParNom(p.getValidePar() != null
                        ? p.getValidePar().getNom() + " " + p.getValidePar().getPrenom() : null)
                .dateCreation(p.getDateCreation())
                .build();
    }
}