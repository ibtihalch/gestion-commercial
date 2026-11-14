import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Pagination, Stack,
  Select, MenuItem, FormControl, Tooltip, TextField,
  InputAdornment, Grid, Collapse, Badge, Divider,
  Card, CardContent, useMediaQuery, useTheme,
} from '@mui/material'
import {
  Add, Edit, Delete, Visibility, Receipt,
  Search, FilterList, Clear, LocalShipping, Payment,
  FileDownload, History,
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import factureClientService from '../../../services/factureClientService'
import clientService        from '../../../services/clientService'
import PaiementModal        from '../../../components/PaiementModal'
import paiementService      from '../../../services/paiementService'
import { useAuth }          from '../../../context/AuthContext'
import toast                from 'react-hot-toast'
import dayjs                from 'dayjs'

// ── Palette ────────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const RED     = '#DC2626'
const GREEN   = '#16A34A'
const BG_PAGE = '#EEF2FB'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURF2   = '#f1f5f9'
const SURF3   = '#fafbfe'

// ── Statuts ────────────────────────────────────────────────────────────────────
const STATUT_STYLE = {
  impayee : { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  payee   : { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  annulee : { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
}

const STATUT_LABEL = {
  impayee : 'Impayée',
  payee   : 'Payée',
  annulee : 'Annulée',
}

const MODES_LABEL = {
  especes        : 'Espèces',
  cheque         : 'Chèque',
  virement       : 'Virement',
  carte_bancaire : 'Carte bancaire',
}

const fmt = (n) =>
  n ? Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—'

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
}

// ── StatutChip ─────────────────────────────────────────────────────────────────
function StatutChip({ value }) {
  const s = STATUT_STYLE[value] || STATUT_STYLE.impayee
  return (
    <Box sx={{
      fontSize: '0.65rem', fontWeight: 700, px: '10px', height: '22px',
      display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
      bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {STATUT_LABEL[value] || value}
    </Box>
  )
}

// ── BlChip ─────────────────────────────────────────────────────────────────────
function BlChip({ numero, id, onClick }) {
  if (!numero && !id) return <span style={{ color: '#c7d4e8' }}>—</span>
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '0.68rem', fontWeight: 700, px: '9px', height: '22px',
        borderRadius: '6px', border: '1px solid #bfdbfe',
        bgcolor: '#dbeafe', color: '#1e40af',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: '#bfdbfe' } : {},
        whiteSpace: 'nowrap',
      }}
    >
      <LocalShipping sx={{ fontSize: 11 }} />
      {numero || `#${id}`}
    </Box>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, border }) {
  return (
    <Box sx={{
      flex: 1, border: `1px solid ${border}`, borderRadius: 2,
      bgcolor: bg, px: { xs: 1.5, md: 2.5 }, py: 1.5,
    }}>
      <Typography sx={{
        fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: '0.82rem', md: '1rem' }, fontWeight: 800, color, mt: 0.3, fontFamily: 'monospace' }}>
        {fmt(value)}
      </Typography>
    </Box>
  )
}

// ── Mobile Card ────────────────────────────────────────────────────────────────
const FactureCard = ({ r, onStatut, onDelete, onPayer, onHistorique, navigate }) => {
  const canEdit     = !['payee', 'annulee'].includes(r.statut)
  const canDel      = r.statut !== 'payee'
  const canPay      = !['payee', 'annulee'].includes(r.statut)
  const estEnRetard = r.dateEcheance && dayjs(r.dateEcheance).isBefore(dayjs()) && r.statut === 'impayee'

  return (
    <Card sx={{
      border: `1px solid ${BORDER}`, borderRadius: '12px', mb: 1.5,
      boxShadow: 'none', transition: 'box-shadow .15s',
      '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
    }}>
      <CardContent sx={{ p: '12px 14px !important' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
          <Stack direction="row" alignItems="center" gap={1} flex={1} minWidth={0}>
            <Typography
              onClick={() => navigate(`/factures/${r.id}`)}
              sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE, cursor: 'pointer', '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}
            >
              {r.numero}
            </Typography>
            <StatutChip value={r.statut || 'impayee'} />
            {estEnRetard && (
              <Box sx={{ fontSize: '0.58rem', fontWeight: 700, px: '7px', height: '18px', display: 'inline-flex', alignItems: 'center', borderRadius: '5px', bgcolor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                En retard
              </Box>
            )}
          </Stack>
          <Stack direction="row" gap={0.5} flexShrink={0}>
            <Tooltip title="Voir">
              <IconButton size="small" onClick={() => navigate(`/factures/${r.id}`)}
                sx={{ width: 28, height: 28, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                <Visibility sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>

            {/* Historique paiements — visible seulement si payée ou annulée */}
            {r.statut !== 'impayee' && (
              <Tooltip title="Historique paiements">
                <IconButton size="small" onClick={() => onHistorique(r)}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#5b21b6', bgcolor: '#ede9fe', '&:hover': { bgcolor: '#ddd6fe' } }}>
                  <History sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Payer">
              <span>
                <IconButton size="small" onClick={() => onPayer(r)} disabled={!canPay}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#166534', bgcolor: '#dcfce7', '&:hover': { bgcolor: '#bbf7d0' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                  <Payment sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Modifier">
              <span>
                <IconButton size="small" onClick={() => navigate(`/factures/${r.id}/modifier`)}
                  disabled={!canEdit}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                  <Edit sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Supprimer">
              <span>
                <IconButton size="small" onClick={() => onDelete(r.id)}
                  disabled={!canDel}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                  <Delete sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD, mb: 0.2, fontFamily: 'Outfit' }}>
          {r.clientNom}
        </Typography>

        {(r.bonLivraisonNumero || r.bonLivraisonId) && (
          <Box mb={0.5}>
            <BlChip
              numero={r.bonLivraisonNumero}
              id={r.bonLivraisonId}
              onClick={r.bonLivraisonId ? () => navigate(`/livraisons/${r.bonLivraisonId}`) : undefined}
            />
          </Box>
        )}

        <Divider sx={{ my: 0.8, borderColor: SURF2 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
              Facture / Échéance
            </Typography>
            <Typography sx={{ fontSize: '0.70rem', color: TEXT_M }}>
              {r.dateFacture ? dayjs(r.dateFacture).format('DD/MM/YY') : '—'}
              {r.dateEcheance && (
                <span style={{ color: estEnRetard ? '#ef4444' : TEXT_S, fontWeight: estEnRetard ? 600 : 400 }}>
                  {' → '}{dayjs(r.dateEcheance).format('DD/MM/YY')}
                </span>
              )}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
              Montant TTC
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
              {fmt(r.montantTtc)}
            </Typography>
          </Box>
        </Stack>

        <Box mt={1}>
          <FormControl size="small" fullWidth>
            <Select
              value={r.statut || 'impayee'}
              onChange={e => onStatut(r.id, e.target.value)}
              renderValue={v => (
                <Typography sx={{ fontSize: '0.72rem', color: TEXT_M }}>
                  Changer statut : <strong>{STATUT_LABEL[v]}</strong>
                </Typography>
              )}
              sx={{
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
                '& .MuiSelect-select': { py: '6px !important' },
              }}
            >
              {Object.keys(STATUT_STYLE).map(s => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem', gap: 1 }}>
                  <StatutChip value={s} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FacturesClientPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall   = useMediaQuery(theme.breakpoints.down('sm'))

  const [rows,       setRows]       = useState([])
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const [stats,      setStats]      = useState(null)
  const [clients,    setClients]    = useState([])

  // ── Modal paiement ─────────────────────────────────────────────────────────
  const [paiementModal, setPaiementModal] = useState({ open: false, facture: null, initialTab: 'form' })

  const handlePayer      = (facture) => setPaiementModal({ open: true, facture, initialTab: 'form'       })
  const handleHistorique = (facture) => setPaiementModal({ open: true, facture, initialTab: 'historique' })
  const handleClosePaiement   = ()   => setPaiementModal({ open: false, facture: null, initialTab: 'form' })
  const handlePaiementSuccess = ()   => {
    load()
    factureClientService.getStats(user?.entrepriseId).then(setStats).catch(() => {})
  }

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(!isMobile)
  const [filters, setFilters] = useState({
    search: '', statut: '', clientId: '', dateDebut: '', dateFin: '',
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const resetFilters = () => {
    setFilters({ search: '', statut: '', clientId: '', dateDebut: '', dateFin: '' })
    setPage(1)
  }

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1) }

  // ── Chargement clients ─────────────────────────────────────────────────────
  useEffect(() => {
    clientService.getAll({ size: 200, entrepriseId: user?.entrepriseId })
      .then(d => setClients(d.content || []))
      .catch(() => {})
  }, [user?.entrepriseId])

  // ── Chargement stats ───────────────────────────────────────────────────────
  useEffect(() => {
    factureClientService.getStats(user?.entrepriseId)
      .then(setStats)
      .catch(() => {})
  }, [user?.entrepriseId])

  // ── Chargement données ─────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true)
    const params = {
      page: page - 1, size: 10, entrepriseId: user?.entrepriseId,
      ...(filters.search    && { search:    filters.search    }),
      ...(filters.statut    && { statut:    filters.statut    }),
      ...(filters.clientId  && { clientId:  filters.clientId  }),
      ...(filters.dateDebut && { dateDebut: filters.dateDebut }),
      ...(filters.dateFin   && { dateFin:   filters.dateFin   }),
    }
    factureClientService.getAll(params)
      .then(d => { setRows(d.content || []); setTotalPages(d.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [page, filters, user?.entrepriseId])

  useEffect(() => { load() }, [load])

  const handleStatut = async (id, statut) => {
    try   { await factureClientService.updateStatut(id, statut); toast.success('Statut mis à jour'); load() }
    catch { toast.error('Erreur changement statut') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return
    try   { await factureClientService.delete(id); toast.success('Facture supprimée'); load() }
    catch { toast.error('Erreur suppression') }
  }

  // ── Export Excel ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {
        page: 0, size: 9999, entrepriseId: user?.entrepriseId,
        ...(filters.search    && { search:    filters.search    }),
        ...(filters.statut    && { statut:    filters.statut    }),
        ...(filters.clientId  && { clientId:  filters.clientId  }),
        ...(filters.dateDebut && { dateDebut: filters.dateDebut }),
        ...(filters.dateFin   && { dateFin:   filters.dateFin   }),
      }
      const data    = await factureClientService.getAll(params)
      const allRows = data.content || []

      if (allRows.length === 0) {
        toast.error('Aucune facture à exporter')
        return
      }

      // Récupération de l'historique paiements en parallèle
      const historiques = await Promise.allSettled(
        allRows.map(r => paiementService.getHistoriqueFactureClient(r.id))
      )

      const excelData = allRows.map((r, idx) => {
        const ht  = r.montantHt  ? Number(r.montantHt)  : 0
        const ttc = r.montantTtc ? Number(r.montantTtc) : 0
        const tva = Number((ttc - ht).toFixed(2))

        const paiements = historiques[idx].status === 'fulfilled'
          ? (historiques[idx].value || [])
          : []

        const dernierPaiement = paiements.length > 0
          ? paiements.reduce((latest, p) =>
              dayjs(p.datePaiement).isAfter(dayjs(latest.datePaiement)) ? p : latest
            )
          : null

        const totalPaye = paiements.reduce((s, p) => s + Number(p.montant || 0), 0)

        return {
          'Numéro de facture'     : r.numero || '',
          'Date facture'          : r.dateFacture  ? dayjs(r.dateFacture).format('DD/MM/YYYY')  : '',
          'Date échéance'         : r.dateEcheance ? dayjs(r.dateEcheance).format('DD/MM/YYYY') : '',
          'Client'                : r.clientNom || '',
          'BL lié'                : r.bonLivraisonNumero || (r.bonLivraisonId ? `#${r.bonLivraisonId}` : ''),
          'Montant HT (MAD)'      : ht,
          'Montant TVA (MAD)'     : tva,
          'Montant TTC (MAD)'     : ttc,
          'Total payé (MAD)'      : Number(totalPaye.toFixed(2)),
          'Reste à payer (MAD)'   : Number(Math.max(ttc - totalPaye, 0).toFixed(2)),
          'Statut'                : STATUT_LABEL[r.statut] || r.statut || '',
          'Date dernier paiement' : dernierPaiement?.datePaiement
                                      ? dayjs(dernierPaiement.datePaiement).format('DD/MM/YYYY')
                                      : '',
          'Mode dernier paiement' : dernierPaiement?.modePaiement
                                      ? (MODES_LABEL[dernierPaiement.modePaiement] || dernierPaiement.modePaiement)
                                      : '',
          'Référence paiement'    : dernierPaiement?.reference || '',
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      ws['!cols'] = [
        { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
        { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 22 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Factures client')

      const parts = ['Factures_client']
      if (filters.clientId) {
        const c = clients.find(c => c.id === filters.clientId)
        if (c) parts.push(c.nom.replace(/\s+/g, '_'))
      }
      if (filters.statut)    parts.push(STATUT_LABEL[filters.statut] || filters.statut)
      if (filters.dateDebut) parts.push(`du_${filters.dateDebut}`)
      if (filters.dateFin)   parts.push(`au_${filters.dateFin}`)
      parts.push(dayjs().format('YYYYMMDD'))

      XLSX.writeFile(wb, `${parts.join('_')}.xlsx`)
      toast.success(`${allRows.length} facture(s) exportée(s)`)
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  // ── Barre de filtres ───────────────────────────────────────────────────────
  const FiltersBar = () => (
    <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            placeholder="Numéro, client, BL…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            fullWidth size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: TEXT_S }} />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilter('search', '')}>
                    <Clear sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ ...sx_input, '& .MuiOutlinedInput-root': { ...sx_input['& .MuiOutlinedInput-root'], bgcolor: 'white' } }}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <Select
              value={filters.statut}
              onChange={e => setFilter('statut', e.target.value)}
              displayEmpty
              renderValue={v => v
                ? <StatutChip value={v} />
                : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Statut</Typography>
              }
              sx={{
                borderRadius: '8px', bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLUE, borderWidth: 1.5 },
                '& .MuiSelect-select': { py: '7px' },
              }}
            >
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Tous</em></MenuItem>
              {Object.keys(STATUT_STYLE).map(s => (
                <MenuItem key={s} value={s} sx={{ gap: 1 }}>
                  <StatutChip value={s} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <Select
              value={filters.clientId}
              onChange={e => setFilter('clientId', e.target.value)}
              displayEmpty
              renderValue={v => v
                ? <Typography sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {clients.find(c => c.id === v)?.nom || v}
                  </Typography>
                : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Client</Typography>
              }
              sx={{
                borderRadius: '8px', bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLUE, borderWidth: 1.5 },
              }}
            >
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Tous</em></MenuItem>
              {clients.map(c => (
                <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.8rem' }}>{c.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date" size="small" fullWidth label="Du"
            value={filters.dateDebut}
            onChange={e => setFilter('dateDebut', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={sx_input}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date" size="small" fullWidth label="Au"
            value={filters.dateFin}
            onChange={e => setFilter('dateFin', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={sx_input}
          />
        </Grid>

        {activeFilterCount > 0 && (
          <Grid item xs={12} sm="auto">
            <Button
              onClick={resetFilters}
              startIcon={<Clear sx={{ fontSize: 14 }} />}
              size="small"
              sx={{
                fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', fontFamily: 'Outfit',
                color: TEXT_M, borderRadius: '8px', px: 1.5, border: `1px solid ${BORDER}`,
                '&:hover': { bgcolor: SURF2 },
              }}
            >
              Réinitialiser ({activeFilterCount})
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  )

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Box>

      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Factures client
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              {rows.length > 0 ? `${rows.length} factures chargées` : 'Liste de vos factures client'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1}>
          {isMobile && (
            <Badge
              badgeContent={activeFilterCount} color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
            >
              <IconButton
                onClick={() => setFiltersOpen(v => !v)}
                sx={{
                  width: 36, height: 36, borderRadius: '8px',
                  bgcolor: filtersOpen ? BG_PAGE : 'white',
                  border: `1px solid ${BORDER}`,
                  color: filtersOpen ? BLUE : TEXT_M,
                }}
              >
                <FilterList sx={{ fontSize: 18 }} />
              </IconButton>
            </Badge>
          )}

          <Tooltip title={
            activeFilterCount > 0
              ? `Exporter les factures filtrées (${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''} actif${activeFilterCount > 1 ? 's' : ''})`
              : 'Exporter toutes les factures en Excel'
          }>
            <Button
              onClick={handleExport}
              disabled={exporting}
              startIcon={!isSmall && <FileDownload sx={{ fontSize: '15px !important' }} />}
              sx={{
                bgcolor: '#f0fdf4', color: '#16A34A',
                border: '1px solid #bbf7d0', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                px: { xs: 1.2, md: 1.8 }, py: 0.8, fontFamily: 'Outfit',
                minWidth: isSmall ? 36 : 'auto',
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' },
                '&.Mui-disabled': { opacity: 0.6 },
              }}
            >
              {isSmall
                ? <FileDownload sx={{ fontSize: 18 }} />
                : exporting ? 'Export…' : 'Excel'
              }
            </Button>
          </Tooltip>

          <Button
            onClick={() => navigate('/factures/nouvelle')}
            startIcon={!isSmall && <Add sx={{ fontSize: '16px !important' }} />}
            sx={{
              bgcolor: BLUE, color: 'white', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              px: { xs: 1.5, md: 2 }, py: 0.8, fontFamily: 'Outfit',
              minWidth: isSmall ? 36 : 'auto',
              boxShadow: `0 4px 12px ${BLUE}30`,
              '&:hover': { bgcolor: BLUE_D },
            }}
          >
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouvelle facture'}
          </Button>
        </Stack>
      </Stack>

      {/* STATS */}
      {stats && (
        <Stack direction="row" gap={{ xs: 1, md: 2 }} mb={2}>
          <StatCard label="Total impayées" value={stats.totalImpayees} color={RED}     bg="#fef2f2" border="#DC262630" />
          <StatCard label="Total payées"   value={stats.totalPayees}   color={GREEN}   bg="#f0fdf4" border="#16A34A30" />
          <StatCard label="Total général"  value={stats.totalGeneral}  color={BLUE_DD} bg={BG_PAGE} border={`${BLUE}30`} />
        </Stack>
      )}

      {/* FILTRES */}
      {isMobile ? <Collapse in={filtersOpen}><FiltersBar /></Collapse> : <FiltersBar />}

      {/* TABLE (desktop) / CARDS (mobile) */}
      {isMobile ? (
        <Box>
          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Chargement...</Typography>
            </Box>
          )}
          {!loading && rows.map(r => (
            <FactureCard
              key={r.id} r={r}
              onStatut={handleStatut}
              onDelete={handleDelete}
              onPayer={handlePayer}
              onHistorique={handleHistorique}
              navigate={navigate}
            />
          ))}
          {!loading && rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <Receipt sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                Aucune facture trouvée
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre première facture'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {[
                  { label: 'Numéro',   align: 'left',  width: '10%' },
                  { label: 'Client',   align: 'left',  width: '16%' },
                  { label: 'BL lié',   align: 'left',  width: '11%' },
                  { label: 'Dates',    align: 'left',  width: '13%' },
                  { label: 'Montants', align: 'right', width: '14%' },
                  { label: 'Statut',   align: 'left',  width: '11%' },
                  { label: '',         align: 'right', width: '16%' },
                ].map(({ label, align, width }, i) => (
                  <TableCell key={i} align={align} sx={{
                    width, fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.5,
                    px: i === 0 ? 2.5 : 1.5, fontFamily: 'Outfit',
                  }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: TEXT_S, fontSize: '0.78rem' }}>
                    Chargement…
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.map((r, idx) => {
                const estEnRetard = r.dateEcheance && dayjs(r.dateEcheance).isBefore(dayjs()) && r.statut === 'impayee'
                const canEdit = !['payee', 'annulee'].includes(r.statut)
                const canDel  = r.statut !== 'payee'
                const canPay  = !['payee', 'annulee'].includes(r.statut)

                return (
                  <TableRow key={r.id} sx={{
                    '&:hover': { bgcolor: SURF3 },
                    borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${SURF2}`,
                    transition: 'background .1s',
                  }}>

                    {/* Numéro */}
                    <TableCell sx={{ px: 2.5, py: 1.4 }}>
                      <Typography onClick={() => navigate(`/factures/${r.id}`)}
                        sx={{ fontSize: '0.76rem', fontWeight: 700, color: BLUE, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}>
                        {r.numero}
                      </Typography>
                    </TableCell>

                    {/* Client */}
                    <TableCell sx={{ py: 1.4, px: 1.5, overflow: 'hidden' }}>
                      <Typography noWrap sx={{ fontSize: '0.76rem', fontWeight: 600, color: BLUE_DD, fontFamily: 'Outfit' }}>
                        {r.clientNom}
                      </Typography>
                    </TableCell>

                    {/* BL lié */}
                    <TableCell sx={{ py: 1.4, px: 1.5 }}>
                      <BlChip
                        numero={r.bonLivraisonNumero}
                        id={r.bonLivraisonId}
                        onClick={r.bonLivraisonId ? () => navigate(`/livraisons/${r.bonLivraisonId}`) : undefined}
                      />
                    </TableCell>

                    {/* Dates */}
                    <TableCell sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>
                        {r.dateFacture ? dayjs(r.dateFacture).format('DD/MM/YY') : <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                      {r.dateEcheance && (
                        <Stack direction="row" alignItems="center" gap={0.5} mt={0.2}>
                          <Typography sx={{ fontSize: '0.70rem', color: estEnRetard ? RED : TEXT_S, fontWeight: estEnRetard ? 600 : 400 }}>
                            {dayjs(r.dateEcheance).format('DD/MM/YY')}
                          </Typography>
                          {estEnRetard && (
                            <Box sx={{
                              fontSize: '0.52rem', fontWeight: 700, px: '5px', height: '15px',
                              display: 'inline-flex', alignItems: 'center', borderRadius: '4px',
                              bgcolor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                            }}>
                              Retard
                            </Box>
                          )}
                        </Stack>
                      )}
                    </TableCell>

                    {/* Montants */}
                    <TableCell align="right" sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
                        {fmt(r.montantTtc)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: TEXT_S, fontFamily: 'monospace' }}>
                        {fmt(r.montantHt)}
                      </Typography>
                    </TableCell>

                    {/* Statut */}
                    <TableCell sx={{ py: 1.4, px: 1.5 }}>
                      <FormControl size="small">
                        <Select
                          value={r.statut || 'impayee'}
                          onChange={e => handleStatut(r.id, e.target.value)}
                          renderValue={v => <StatutChip value={v} />}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            '& .MuiSelect-select': { p: '0 !important' },
                            '& .MuiSelect-icon': { color: TEXT_S, fontSize: 16, right: -2 },
                            bgcolor: 'transparent', minWidth: 110,
                          }}
                        >
                          {Object.keys(STATUT_STYLE).map(s => (
                            <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem', gap: 1 }}>
                              <StatutChip value={s} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                      <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="Voir">
                          <IconButton size="small" onClick={() => navigate(`/factures/${r.id}`)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                            <Visibility sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Historique paiements — visible seulement si payée ou annulée */}
                        {r.statut !== 'impayee' && (
                          <Tooltip title="Historique paiements">
                            <IconButton size="small" onClick={() => handleHistorique(r)}
                              sx={{ width: 28, height: 28, borderRadius: '6px', color: '#5b21b6', bgcolor: '#ede9fe', '&:hover': { bgcolor: '#ddd6fe' } }}>
                              <History sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Payer">
                          <span>
                            <IconButton size="small" onClick={() => handlePayer(r)} disabled={!canPay}
                              sx={{ width: 28, height: 28, borderRadius: '6px', color: '#166534', bgcolor: '#dcfce7', '&:hover': { bgcolor: '#bbf7d0' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Payment sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <span>
                            <IconButton size="small" onClick={() => navigate(`/factures/${r.id}/modifier`)}
                              disabled={!canEdit}
                              sx={{ width: 28, height: 28, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <span>
                            <IconButton size="small" onClick={() => handleDelete(r.id)}
                              disabled={!canDel}
                              sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Receipt sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                        Aucune facture trouvée
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre première facture en cliquant sur le bouton ci-dessus'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* PAGINATION */}
      <Box display="flex" justifyContent="center" mt={2.5}>
        <Pagination
          count={totalPages} page={page}
          onChange={(_, v) => setPage(v)}
          size="small"
          sx={{
            '& .MuiPaginationItem-root': { fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px', color: TEXT_M, fontFamily: 'Outfit', '&:hover': { bgcolor: BG_PAGE, color: BLUE } },
            '& .Mui-selected': { bgcolor: `${BLUE} !important`, color: 'white !important' },
          }}
        />
      </Box>

      {/* MODAL PAIEMENT / HISTORIQUE */}
      <PaiementModal
        open={paiementModal.open}
        onClose={handleClosePaiement}
        onSuccess={handlePaiementSuccess}
        facture={paiementModal.facture}
        type="client"
        initialTab={paiementModal.initialTab}
      />

    </Box>
  )
}