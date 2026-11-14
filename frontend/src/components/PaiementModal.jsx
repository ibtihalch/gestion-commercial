import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Stack, Button, TextField, Select,
  MenuItem, FormControl, InputLabel, Divider, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Tooltip,
} from '@mui/material'
import {
  Close, Payment, AccountBalance, AttachMoney,
  CreditCard, CheckCircle, History, Add,
} from '@mui/icons-material'
import paiementService from '../services/paiementService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ── Palette (identique au projet) ─────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const GREEN   = '#16A34A'
const ORANGE  = '#F59E0B'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURF2   = '#f1f5f9'
const SURF3   = '#fafbfe'
const BG_PAGE = '#EEF2FB'

const fmt = (n) =>
  n != null ? Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—'

// ── Modes de paiement ─────────────────────────────────────────────────────────
const MODES = [
  { value: 'especes',       label: 'Espèces',        icon: <AttachMoney sx={{ fontSize: 16 }} /> },
  { value: 'cheque',        label: 'Chèque',         icon: <AccountBalance sx={{ fontSize: 16 }} /> },
  { value: 'virement',      label: 'Virement',       icon: <Payment sx={{ fontSize: 16 }} /> },
  { value: 'carte_bancaire',label: 'Carte bancaire', icon: <CreditCard sx={{ fontSize: 16 }} /> },
]

const MODE_STYLE = {
  especes       : { bg: '#f0fdf4', color: GREEN,   border: '#bbf7d0' },
  cheque        : { bg: '#eff6ff', color: BLUE,    border: '#bfdbfe' },
  virement      : { bg: '#fdf4ff', color: '#7c3aed', border: '#e9d5ff' },
  carte_bancaire: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
}

// ── Chip mode paiement ─────────────────────────────────────────────────────────
function ModeChip({ value }) {
  const mode = MODES.find(m => m.value === value)
  const s    = MODE_STYLE[value] || { bg: SURF2, color: TEXT_M, border: BORDER }
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '0.65rem', fontWeight: 700, px: '10px', height: '22px',
      borderRadius: '6px', bgcolor: s.bg, color: s.color,
      border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
    }}>
      {mode?.icon}
      {mode?.label || value}
    </Box>
  )
}

// ── Barre de progression du paiement ─────────────────────────────────────────
function PaymentProgress({ totalPaye, montantTtc }) {
  const pct     = montantTtc > 0 ? Math.min((totalPaye / montantTtc) * 100, 100) : 0
  const reste   = Math.max(montantTtc - totalPaye, 0)
  const complet = pct >= 100

  return (
    <Box sx={{ bgcolor: complet ? '#f0fdf4' : BG_PAGE, borderRadius: 2, p: 2, border: `1px solid ${complet ? '#bbf7d0' : BORDER}` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: complet ? GREEN : TEXT_M, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {complet ? '✓ Facture soldée' : 'Avancement du paiement'}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: complet ? GREEN : BLUE }}>
          {pct.toFixed(0)} %
        </Typography>
      </Stack>

      {/* Barre */}
      <Box sx={{ height: 8, bgcolor: complet ? '#dcfce7' : '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{
          height: '100%', width: `${pct}%`,
          background: complet
            ? `linear-gradient(90deg, ${GREEN}, #4ade80)`
            : `linear-gradient(90deg, ${BLUE}, ${ORANGE})`,
          borderRadius: 4,
          transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
        }} />
      </Box>

      <Stack direction="row" justifyContent="space-between" mt={1}>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payé</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: complet ? GREEN : BLUE_DD, fontFamily: 'monospace' }}>
            {fmt(totalPaye)}
          </Typography>
        </Box>
        {!complet && (
          <Box textAlign="right">
            <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reste à payer</Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>
              {fmt(reste)}
            </Typography>
          </Box>
        )}
        <Box textAlign="right">
          <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
            {fmt(montantTtc)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

/**
 * PaiementModal — Modal réutilisable pour enregistrer un paiement.
 *
 * Props :
 *   open         {boolean}   — visibilité du modal
 *   onClose      {function}  — fermeture du modal
 *   onSuccess    {function}  — appelé après un paiement réussi (pour recharger la liste)
 *   facture      {object}    — { id, numero, montantTtc, statut, clientNom?, fournisseurNom? }
 *   type         {string}    — 'client' | 'fournisseur'
 *   initialTab   {string}    — 'form' | 'historique' (onglet ouvert par défaut)
 */
export default function PaiementModal({ open, onClose, onSuccess, facture, type = 'client', initialTab = 'form' }) {

  const isClient = type === 'client'

  // ── État formulaire ────────────────────────────────────────────────────────
  const today = dayjs().format('YYYY-MM-DD')
  const [form, setForm] = useState({
    datePaiement : today,
    modePaiement : 'virement',
    montant      : '',
    reference    : '',
    remarque     : '',
  })
  const [errors,   setErrors]   = useState({})
  const [saving,   setSaving]   = useState(false)

  // ── État historique ────────────────────────────────────────────────────────
  const [historique,    setHistorique]    = useState([])
  const [loadingHisto,  setLoadingHisto]  = useState(false)
  // ↓ initialTab permet d'ouvrir directement l'onglet historique depuis la liste
  const [tab, setTab] = useState(initialTab)

  // ── Réinitialisation à l'ouverture ────────────────────────────────────────
  useEffect(() => {
    if (open && facture) {
      const reste = Math.max((facture.montantTtc || 0) - (facture.totalPaye || 0), 0)
      setForm({
        datePaiement : today,
        modePaiement : 'virement',
        montant      : reste > 0 ? reste.toFixed(2) : '',
        reference    : '',
        remarque     : '',
      })
      setErrors({})
      setTab(initialTab)   // ← respecte l'onglet demandé à chaque ouverture
      loadHistorique()
    }
  }, [open, facture?.id, initialTab])

  // ── Chargement historique ─────────────────────────────────────────────────
  const loadHistorique = async () => {
    if (!facture?.id) return
    setLoadingHisto(true)
    try {
      const data = isClient
        ? await paiementService.getHistoriqueFactureClient(facture.id)
        : await paiementService.getHistoriqueFactureFournisseur(facture.id)
      setHistorique(data || [])
    } catch {
      setHistorique([])
    } finally {
      setLoadingHisto(false)
    }
  }

  // ── Total déjà payé (calculé depuis l'historique) ─────────────────────────
  const totalPaye  = historique.reduce((s, p) => s + Number(p.montant || 0), 0)
  const montantTtc = Number(facture?.montantTtc || 0)
  const reste      = Math.max(montantTtc - totalPaye, 0)

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.datePaiement) e.datePaiement = 'Date obligatoire'
    if (!form.modePaiement) e.modePaiement = 'Mode de paiement obligatoire'
    if (!form.montant || isNaN(Number(form.montant)) || Number(form.montant) <= 0)
      e.montant = 'Montant invalide (doit être > 0)'
    return e
  }

  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      const payload = {
        datePaiement : form.datePaiement,
        modePaiement : form.modePaiement,
        montant      : Number(form.montant),
        reference    : form.reference || null,
        remarque     : form.remarque  || null,
      }

      if (isClient) {
        await paiementService.payerFactureClient(facture.id, payload)
      } else {
        await paiementService.payerFactureFournisseur(facture.id, payload)
      }

      toast.success('Paiement enregistré avec succès !')
      await loadHistorique()
      setTab('historique')
      onSuccess?.()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!facture) return null

  const tiers = isClient ? facture.clientNom : facture.fournisseurNom

  // ── Styles communs input ───────────────────────────────────────────────────
  const sx_input = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px', fontSize: '0.82rem',
      '& fieldset': { borderColor: BORDER },
      '&:hover fieldset': { borderColor: BLUE + '60' },
      '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.78rem', color: TEXT_M,
      '&.Mui-focused': { color: BLUE },
    },
    '& .MuiFormHelperText-root': { fontSize: '0.68rem' },
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(26,111,232,0.15)',
        }
      }}
    >

      {/* ── EN-TÊTE ── */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Bande dégradé */}
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

        <Box sx={{ bgcolor: 'white', px: 3, pt: 2.5, pb: 2 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '10px',
                bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${BLUE}20`,
              }}>
                <Payment sx={{ fontSize: 18, color: BLUE }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
                  {tab === 'historique' ? 'Historique des paiements' : 'Enregistrer un paiement'}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} mt={0.3}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: BLUE, fontFamily: 'monospace' }}>
                    {facture.numero}
                  </Typography>
                  {tiers && (
                    <>
                      <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: TEXT_S }} />
                      <Typography sx={{ fontSize: '0.72rem', color: TEXT_M, fontFamily: 'Outfit' }}>
                        {tiers}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>
            </Stack>
            <IconButton size="small" onClick={onClose} sx={{ color: TEXT_S, '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' }, borderRadius: '8px' }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: SURF3 }}>

        {/* ── BARRE DE PROGRESSION ── */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
          <PaymentProgress totalPaye={totalPaye} montantTtc={montantTtc} />
        </Box>

        {/* ── ONGLETS ── */}
        <Stack direction="row" sx={{ px: 3, mb: 2, gap: 1 }}>
          {[
            { key: 'form',       label: 'Nouveau paiement',              icon: <Add sx={{ fontSize: 14 }} />      },
            { key: 'historique', label: `Historique (${historique.length})`, icon: <History sx={{ fontSize: 14 }} /> },
          ].map(t => (
            <Box
              key={t.key}
              onClick={() => setTab(t.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: '6px',
                px: 1.5, py: 0.7, borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit',
                transition: 'all 0.15s',
                bgcolor: tab === t.key ? BLUE : 'white',
                color:   tab === t.key ? 'white' : TEXT_M,
                border:  `1px solid ${tab === t.key ? BLUE : BORDER}`,
                boxShadow: tab === t.key ? `0 4px 12px ${BLUE}30` : 'none',
              }}
            >
              {t.icon}
              {t.label}
            </Box>
          ))}
        </Stack>

        {/* ══ ONGLET FORMULAIRE ══ */}
        {tab === 'form' && (
          <Box sx={{ px: 3, pb: 3 }}>

            {/* Facture soldée */}
            {reste === 0 && totalPaye > 0 && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 2, p: 2, mb: 2,
              }}>
                <CheckCircle sx={{ fontSize: 20, color: GREEN }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: GREEN, fontFamily: 'Outfit' }}>
                  Cette facture est entièrement soldée. Aucun paiement supplémentaire requis.
                </Typography>
              </Box>
            )}

            <Stack spacing={2}>

              {/* Date + Mode — ligne */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>

                {/* Date paiement */}
                <TextField
                  type="date"
                  label="Date de paiement *"
                  value={form.datePaiement}
                  onChange={e => setField('datePaiement', e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.datePaiement}
                  helperText={errors.datePaiement}
                  sx={sx_input}
                />

                {/* Mode paiement */}
                <FormControl fullWidth size="small" error={!!errors.modePaiement}>
                  <InputLabel sx={{ fontSize: '0.78rem', color: errors.modePaiement ? '#d32f2f' : TEXT_M, '&.Mui-focused': { color: BLUE } }}>
                    Mode de paiement *
                  </InputLabel>
                  <Select
                    value={form.modePaiement}
                    onChange={e => setField('modePaiement', e.target.value)}
                    label="Mode de paiement *"
                    renderValue={v => <ModeChip value={v} />}
                    sx={{
                      borderRadius: '8px', fontSize: '0.82rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.modePaiement ? '#d32f2f' : BORDER },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLUE, borderWidth: 1.5 },
                      '& .MuiSelect-select': { py: '7px' },
                    }}
                  >
                    {MODES.map(m => (
                      <MenuItem key={m.value} value={m.value} sx={{ gap: 1 }}>
                        <ModeChip value={m.value} />
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.modePaiement && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#d32f2f', mt: 0.4, ml: 1.5 }}>
                      {errors.modePaiement}
                    </Typography>
                  )}
                </FormControl>
              </Stack>

              {/* Montant */}
              <TextField
                label="Montant *"
                type="number"
                value={form.montant}
                onChange={e => setField('montant', e.target.value)}
                size="small"
                fullWidth
                error={!!errors.montant}
                helperText={errors.montant || (reste > 0 ? `Reste à payer : ${fmt(reste)}` : '')}
                InputProps={{
                  endAdornment: (
                    <Typography sx={{ fontSize: '0.78rem', color: TEXT_S, fontFamily: 'monospace', mr: 0.5 }}>
                      MAD
                    </Typography>
                  ),
                  inputProps: { min: 0.01, step: 0.01 },
                }}
                sx={sx_input}
              />

              {/* Référence */}
              <TextField
                label="Référence de paiement"
                placeholder="N° chèque, référence virement…"
                value={form.reference}
                onChange={e => setField('reference', e.target.value)}
                size="small"
                fullWidth
                sx={sx_input}
              />

              {/* Remarque */}
              <TextField
                label="Remarque"
                placeholder="Observation facultative…"
                value={form.remarque}
                onChange={e => setField('remarque', e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
                sx={sx_input}
              />

            </Stack>
          </Box>
        )}

        {/* ══ ONGLET HISTORIQUE ══ */}
        {tab === 'historique' && (
          <Box sx={{ px: 3, pb: 3 }}>
            {loadingHisto ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ color: BLUE }} />
              </Box>
            ) : historique.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                  <History sx={{ fontSize: 20, color: '#c7d4e8' }} />
                </Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                  Aucun paiement enregistré
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                  Enregistrez le premier paiement via l'onglet "Nouveau paiement"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: SURF3 }}>
                      {['Date', 'Mode', 'Montant', 'Référence', 'Validé par'].map((h, i) => (
                        <TableCell key={i} sx={{
                          fontSize: '0.6rem', fontWeight: 700, color: TEXT_S,
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          py: 1.2, borderBottom: `1px solid ${BORDER}`,
                          fontFamily: 'Outfit',
                        }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historique.map((p, idx) => (
                      <TableRow key={p.id} sx={{
                        '&:hover': { bgcolor: SURF3 },
                        borderBottom: idx === historique.length - 1 ? 'none' : `1px solid ${SURF2}`,
                      }}>

                        {/* Date */}
                        <TableCell sx={{ fontSize: '0.72rem', color: '#475569', py: 1.2, whiteSpace: 'nowrap' }}>
                          {p.datePaiement ? dayjs(p.datePaiement).format('DD/MM/YYYY') : '—'}
                        </TableCell>

                        {/* Mode */}
                        <TableCell sx={{ py: 1.2 }}>
                          <ModeChip value={p.modePaiement} />
                        </TableCell>

                        {/* Montant */}
                        <TableCell sx={{ py: 1.2, whiteSpace: 'nowrap' }}>
                          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: GREEN, fontFamily: 'monospace' }}>
                            {fmt(p.montant)}
                          </Typography>
                        </TableCell>

                        {/* Référence */}
                        <TableCell sx={{ py: 1.2 }}>
                          {p.reference ? (
                            <Tooltip title={p.remarque || ''} arrow placement="top">
                              <Typography sx={{ fontSize: '0.70rem', color: TEXT_M, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.reference}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <span style={{ color: '#c7d4e8' }}>—</span>
                          )}
                        </TableCell>

                        {/* Validé par */}
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography sx={{ fontSize: '0.70rem', color: TEXT_M, fontFamily: 'Outfit' }}>
                            {p.valideParLogin || '—'}
                          </Typography>
                          {p.dateCreation && (
                            <Typography sx={{ fontSize: '0.6rem', color: TEXT_S }}>
                              {dayjs(p.dateCreation).format('DD/MM/YY HH:mm')}
                            </Typography>
                          )}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Total ligne */}
                <Box sx={{ bgcolor: SURF3, px: 2, py: 1.2, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Outfit' }}>
                    Total payé
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: GREEN, fontFamily: 'monospace' }}>
                    {fmt(totalPaye)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

      </DialogContent>

      {/* ── ACTIONS ── */}
      <Divider sx={{ borderColor: BORDER }} />
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'white', gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            fontSize: '0.78rem', fontWeight: 600, textTransform: 'none',
            color: TEXT_M, borderRadius: '8px', px: 2,
            border: `1px solid ${BORDER}`,
            fontFamily: 'Outfit',
            '&:hover': { bgcolor: SURF2 },
          }}
        >
          Fermer
        </Button>

        {tab === 'form' && reste > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircle sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: BLUE, color: 'white', borderRadius: '8px',
              fontSize: '0.78rem', fontWeight: 700, textTransform: 'none',
              px: 2.5, fontFamily: 'Outfit',
              boxShadow: `0 4px 12px ${BLUE}30`,
              '&:hover': { bgcolor: BLUE_D },
              '&.Mui-disabled': { bgcolor: '#e2e8f0', color: TEXT_S },
            }}
          >
            {saving ? 'Enregistrement...' : 'Confirmer le paiement'}
          </Button>
        )}
      </DialogActions>

    </Dialog>
  )
}