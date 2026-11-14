import api from './api'

const paiementService = {

  // ── Facture Client ──────────────────────────────────────────────────────────

  /**
   * Enregistre un paiement sur une facture client.
   * POST /api/factures-client/{id}/payer
   */
  payerFactureClient: (factureId, data) =>
    api.post(`/factures-client/${factureId}/payer`, data).then(r => r.data.data),

  /**
   * Retourne l'historique des paiements d'une facture client.
   * GET /api/factures-client/{id}/paiements
   */
  getHistoriqueFactureClient: (factureId) =>
    api.get(`/factures-client/${factureId}/paiements`).then(r => r.data.data),

  // ── Facture Fournisseur ─────────────────────────────────────────────────────

  /**
   * Enregistre un paiement sur une facture fournisseur.
   * POST /api/factures-fournisseur/{id}/payer
   */
  payerFactureFournisseur: (factureId, data) =>
    api.post(`/factures-fournisseur/${factureId}/payer`, data).then(r => r.data.data),

  /**
   * Retourne l'historique des paiements d'une facture fournisseur.
   * GET /api/factures-fournisseur/{id}/paiements
   */
  getHistoriqueFactureFournisseur: (factureId) =>
    api.get(`/factures-fournisseur/${factureId}/paiements`).then(r => r.data.data),
}

export default paiementService