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
  Add, Edit, Delete, Visibility, LocalShipping,
  Search, FilterList, Clear, Assignment,
} from '@mui/icons-material'
import bonLivraisonService      from '../../../services/bonLivraisonService'
import clientService            from '../../../services/clientService'
import affaireService           from '../../../services/affaireService'
import { useAuth }              from '../../../context/AuthContext'
import toast                    from 'react-hot-toast'
import dayjs                    from 'dayjs'

// ── Palette ────────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const BG_PAGE = '#EEF2FB'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURF2   = '#f1f5f9'
const SURF3   = '#fafbfe'

// ── Statuts ────────────────────────────────────────────────────────────────────
const STATUT_STYLE = {
  en_cours : { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  livre    : { bg: '#dbeafe', color: '#1e40af',  border: '#bfdbfe' },
  facture  : { bg: '#dcfce7', color: '#166534',  border: '#bbf7d0' },
  annule   : { bg: '#fee2e2', color: '#991b1b',  border: '#fecaca' },
}

const STATUT_LABEL = {
  en_cours : 'En cours',
  livre    : 'Livré',
  facture  : 'Facturé',
  annule   : 'Annulé',
}

const TOOLTIP_AUTO = {
  livre  : 'Livré automatiquement (BL créé)',
  facture: 'Facturé automatiquement (BF créée)',
}

const STATUTS_MANUELS = ['en_cours', 'livre', 'facture', 'annule']

const fmtNum = (n) => n ? Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : '—'

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
  const s = STATUT_STYLE[value] || STATUT_STYLE.en_cours
  return (
    <Box sx={{
      fontSize: '0.62rem', fontWeight: 700, px: '8px', height: '20px',
      display: 'inline-flex', alignItems: 'center', borderRadius: '5px',
      bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {STATUT_LABEL[value] || value}
    </Box>
  )
}

// ── StatutSelect ───────────────────────────────────────────────────────────────
function StatutSelect({ value, onChange, tableMode = false }) {
  const isAuto = value === 'livre' || value === 'facture'

  return (
    <Tooltip title={isAuto ? TOOLTIP_AUTO[value] : ''} disableHoverListener={!isAuto}>
      <FormControl size="small">
        <Select
          value={value || 'en_cours'}
          onChange={onChange}
          renderValue={v => <StatutChip value={v} />}
          sx={tableMode ? {
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiSelect-select': { p: '0 !important', pr: '20px !important' },
            '& .MuiSelect-icon': { color: TEXT_S, fontSize: 14, right: -4 },
            bgcolor: 'transparent', minWidth: 90,
          } : {
            borderRadius: '8px', fontSize: '0.78rem',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
            '& .MuiSelect-select': { py: '6px !important' },
          }}
        >
          {STATUTS_MANUELS.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem', gap: 1 }}>
              <StatutChip value={s} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  )
}

// ── BccChip ────────────────────────────────────────────────────────────────────
function BccChip({ numero, id, onClick }) {
  if (!numero && !id) return <span style={{ color: '#c7d4e8' }}>—</span>
  const label = numero || `#${id}`
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex', alignItems: 'flex-start', gap: '3px',
        fontSize: '0.64rem', fontWeight: 700, px: '7px', py: '3px',
        borderRadius: '5px', border: '1px solid #bfdbfe',
        bgcolor: '#dbeafe', color: '#1e40af',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: '#bfdbfe' } : {},
        whiteSpace: 'normal',
        wordBreak: 'break-all',
        lineHeight: 1.3,
      }}
    >
      <Assignment sx={{ fontSize: 10, flexShrink: 0, mt: '1px' }} />
      {label}
    </Box>
  )
}

// ── DateCell — affiche date réelle + date prévue empilées ──────────────────────
function DateCell({ dateLivraison, dateLivraisonPrevue, estExpire }) {
  return (
    <Box>
      {/* Date réelle */}
      {dateLivraison ? (
        <Stack direction="row" alignItems="center" gap={0.4}>
          <Box>
            <Typography sx={{
              fontSize: '0.72rem', lineHeight: 1.2,
              color: estExpire ? '#ef4444' : '#334155',
              fontWeight: estExpire ? 600 : 500,
            }}>
              {dayjs(dateLivraison).format('DD/MM/YY')}
            </Typography>
            <Typography sx={{ fontSize: '0.55rem', color: TEXT_S, lineHeight: 1 }}>
              {dayjs(dateLivraison).format('ddd')}
            </Typography>
          </Box>
          {estExpire && (
            <Box sx={{
              fontSize: '0.5rem', fontWeight: 700, px: '5px', height: '14px',
              display: 'inline-flex', alignItems: 'center', borderRadius: '3px',
              bgcolor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', flexShrink: 0,
            }}>
              Exp.
            </Box>
          )}
        </Stack>
      ) : <span style={{ color: '#c7d4e8', fontSize: '0.72rem' }}>—</span>}

      {/* Date prévue en dessous, plus discrète */}
      {dateLivraisonPrevue && (
        <Box sx={{ mt: 0.3 }}>
          <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, lineHeight: 1 }}>
            Prévu: {dayjs(dateLivraisonPrevue).format('DD/MM/YY')}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// ── Mobile Card ────────────────────────────────────────────────────────────────
const BlCard = ({ r, onStatut, onDelete, navigate }) => {
  const canEdit   = !['facture', 'annule'].includes(r.statut)
  const canDel    = r.statut !== 'facture'
  const estExpire = dayjs(r.dateLivraison).isBefore(dayjs()) && r.statut === 'en_cours'

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
              onClick={() => navigate(`/livraisons/${r.id}`)}
              sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE, cursor: 'pointer',
                '&:hover': { color: BLUE_D, textDecoration: 'underline' }, whiteSpace: 'nowrap' }}
            >
              {r.numero}
            </Typography>
            <StatutChip value={r.statut || 'en_cours'} />
            {estExpire && (
              <Box sx={{ fontSize: '0.58rem', fontWeight: 700, px: '7px', height: '18px',
                display: 'inline-flex', alignItems: 'center', borderRadius: '5px',
                bgcolor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                Expiré
              </Box>
            )}
          </Stack>
          <Stack direction="row" gap={0.5} flexShrink={0} ml={1}>
            <Tooltip title="Voir">
              <IconButton size="small" onClick={() => navigate(`/livraisons/${r.id}`)}
                sx={{ width: 30, height: 30, borderRadius: '7px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                <Visibility sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={canEdit ? 'Modifier' : 'Non modifiable'}>
              <span>
                <IconButton size="small" onClick={() => navigate(`/livraisons/${r.id}/modifier`)}
                  disabled={!canEdit}
                  sx={{ width: 30, height: 30, borderRadius: '7px', color: '#92400e', bgcolor: '#fef3c7',
                    '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.35 } }}>
                  <Edit sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={canDel ? 'Supprimer (restaure le stock)' : 'Non supprimable'}>
              <span>
                <IconButton size="small" onClick={() => onDelete(r.id)}
                  disabled={!canDel}
                  sx={{ width: 30, height: 30, borderRadius: '7px', color: '#ef4444', bgcolor: '#fef2f2',
                    '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.35 } }}>
                  <Delete sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD, mb: 0.1, fontFamily: 'Outfit' }}>
          {r.clientNom}
        </Typography>

        <Stack direction="row" gap={1.5} flexWrap="wrap" mb={0.5}>
          {(r.bonCommandeClientNumero || r.bonCommandeClientId) && (
            <BccChip
              numero={r.bonCommandeClientNumero}
              id={r.bonCommandeClientId}
              onClick={r.bonCommandeClientId ? () => navigate(`/commandes-client/${r.bonCommandeClientId}`) : undefined}
            />
          )}
          {r.affaireNom && (
            <Typography sx={{ fontSize: '0.68rem', color: TEXT_S }}>
              📁 {r.affaireNom}
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 0.8, borderColor: SURF2 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={1}>
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
              Date livraison
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: estExpire ? '#ef4444' : '#334155', fontWeight: estExpire ? 600 : 500 }}>
              {r.dateLivraison ? dayjs(r.dateLivraison).format('DD/MM/YYYY') : '—'}
            </Typography>
            {r.dateLivraisonPrevue && (
              <>
                <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.5, mb: 0.1 }}>
                  Livraison prévue
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#334155', fontWeight: 500 }}>
                  {dayjs(r.dateLivraisonPrevue).format('DD/MM/YYYY')}
                </Typography>
              </>
            )}
          </Box>
          <Box textAlign="right">
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.1 }}>HT</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: TEXT_M, fontFamily: 'monospace' }}>
              {fmtNum(r.montantHt)} MAD
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.5, mb: 0.1 }}>TTC</Typography>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
              {fmtNum(r.montantTtc)} MAD
            </Typography>
          </Box>
        </Stack>

        <StatutSelect value={r.statut} onChange={e => onStatut(r.id, e.target.value)} />

      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function BonsLivraisonPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall   = useMediaQuery(theme.breakpoints.down('sm'))

  const [rows,       setRows]       = useState([])
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [clients,    setClients]    = useState([])
  const [affaires,   setAffaires]   = useState([])

  const [filtersOpen, setFiltersOpen] = useState(!isMobile)
  const [filters, setFilters] = useState({
    search: '', statut: '', clientId: '', affaireId: '', dateDebut: '', dateFin: '',
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const resetFilters = () => {
    setFilters({ search: '', statut: '', clientId: '', affaireId: '', dateDebut: '', dateFin: '' })
    setPage(1)
  }
  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }

  useEffect(() => {
    clientService.getAll({ size: 200, entrepriseId: user?.entrepriseId })
      .then(d => setClients(d.content || [])).catch(() => {})
    affaireService.getAll({ size: 200, entrepriseId: user?.entrepriseId })
      .then(d => setAffaires(d.content || [])).catch(() => {})
  }, [user?.entrepriseId])

  const load = useCallback(() => {
    setLoading(true)
    const params = {
      page: page - 1, size: 10, entrepriseId: user?.entrepriseId,
      ...(filters.search    && { search:    filters.search    }),
      ...(filters.statut    && { statut:    filters.statut    }),
      ...(filters.clientId  && { clientId:  filters.clientId  }),
      ...(filters.affaireId && { affaireId: filters.affaireId }),
      ...(filters.dateDebut && { dateDebut: filters.dateDebut }),
      ...(filters.dateFin   && { dateFin:   filters.dateFin   }),
    }
    bonLivraisonService.getAll(params)
      .then(d => { setRows(d.content || []); setTotalPages(d.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [page, filters, user?.entrepriseId])

  useEffect(() => { load() }, [load])

  const handleStatut = async (id, statut) => {
    try   { await bonLivraisonService.updateStatut(id, statut); toast.success('Statut mis à jour'); load() }
    catch { toast.error('Erreur changement statut') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de livraison ? Le stock sera restauré.')) return
    try   { await bonLivraisonService.delete(id); toast.success('BL supprimé — stock restauré'); load() }
    catch { toast.error('Erreur suppression') }
  }

  // ── Barre de filtres ───────────────────────────────────────────────────────
  const FiltersBar = () => (
    <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            placeholder="Numéro, client, BCC…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            fullWidth size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: TEXT_S }} /></InputAdornment>,
              endAdornment: filters.search
                ? <InputAdornment position="end"><IconButton size="small" onClick={() => setFilter('search', '')}><Clear sx={{ fontSize: 14 }} /></IconButton></InputAdornment>
                : null,
            }}
            sx={{ ...sx_input, '& .MuiOutlinedInput-root': { ...sx_input['& .MuiOutlinedInput-root'], bgcolor: 'white' } }}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={1.5}>
          <FormControl fullWidth size="small">
            <Select value={filters.statut} onChange={e => setFilter('statut', e.target.value)} displayEmpty
              renderValue={v => v ? <StatutChip value={v} /> : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Statut</Typography>}
              sx={{ borderRadius: '8px', bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '& .MuiSelect-select': { py: '7px' } }}>
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Tous</em></MenuItem>
              {Object.keys(STATUT_STYLE).map(s => (
                <MenuItem key={s} value={s} sx={{ gap: 1 }}><StatutChip value={s} /></MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <Select value={filters.clientId} onChange={e => setFilter('clientId', e.target.value)} displayEmpty
              renderValue={v => v
                ? <Typography sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clients.find(c => c.id === v)?.nom || v}</Typography>
                : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Client</Typography>}
              sx={{ borderRadius: '8px', bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Tous</em></MenuItem>
              {clients.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.8rem' }}>{c.nom}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <Select value={filters.affaireId} onChange={e => setFilter('affaireId', e.target.value)} displayEmpty
              renderValue={v => v
                ? <Typography sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{affaires.find(a => a.id === v)?.nom || v}</Typography>
                : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Affaire</Typography>}
              sx={{ borderRadius: '8px', bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Toutes</em></MenuItem>
              {affaires.map(a => <MenuItem key={a.id} value={a.id} sx={{ fontSize: '0.8rem' }}>{a.nom}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={1.5}>
          <TextField type="date" size="small" fullWidth label="Du"
            value={filters.dateDebut} onChange={e => setFilter('dateDebut', e.target.value)}
            InputLabelProps={{ shrink: true }} sx={sx_input} />
        </Grid>

        <Grid item xs={6} sm={3} md={1.5}>
          <TextField type="date" size="small" fullWidth label="Au"
            value={filters.dateFin} onChange={e => setFilter('dateFin', e.target.value)}
            InputLabelProps={{ shrink: true }} sx={sx_input} />
        </Grid>

        {activeFilterCount > 0 && (
          <Grid item xs={12} sm="auto">
            <Button onClick={resetFilters} startIcon={<Clear sx={{ fontSize: 14 }} />} size="small"
              sx={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', fontFamily: 'Outfit',
                color: TEXT_M, borderRadius: '8px', px: 1.5, border: `1px solid ${BORDER}`, '&:hover': { bgcolor: SURF2 } }}>
              Réinitialiser ({activeFilterCount})
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  )

  // ── Colonnes desktop (largeurs fixes pour éviter le scroll) ────────────────
  // Total ciblé ≈ 100% de la largeur disponible
  const COL = {
    numero  : { w: '9%',   align: 'left'  },
    client  : { w: '13%',  align: 'left'  },
    bcc     : { w: '11%',  align: 'left'  },
    affaire : { w: '13%',  align: 'left'  },
    dates   : { w: '13%',  align: 'left'  },  // date réelle + prévue empilées
    montant : { w: '10%',  align: 'right' },
    statut  : { w: '10%',  align: 'left'  },
    actions : { w: '8%',   align: 'right' },
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Box>

      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LocalShipping sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Bons de livraison
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              {rows.length > 0 ? `${rows.length} livraisons chargées` : 'Liste de vos bons de livraison'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1}>
          {isMobile && (
            <Badge badgeContent={activeFilterCount} color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <IconButton onClick={() => setFiltersOpen(v => !v)}
                sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: filtersOpen ? BG_PAGE : 'white',
                  border: `1px solid ${BORDER}`, color: filtersOpen ? BLUE : TEXT_M }}>
                <FilterList sx={{ fontSize: 18 }} />
              </IconButton>
            </Badge>
          )}
          <Button onClick={() => navigate('/livraisons/nouveau')}
            startIcon={!isSmall && <Add sx={{ fontSize: '16px !important' }} />}
            sx={{ bgcolor: BLUE, color: 'white', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
              textTransform: 'none', px: { xs: 1.5, md: 2 }, py: 0.8, fontFamily: 'Outfit',
              minWidth: isSmall ? 36 : 'auto', boxShadow: `0 4px 12px ${BLUE}30`, '&:hover': { bgcolor: BLUE_D } }}>
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouveau BL'}
          </Button>
        </Stack>
      </Stack>

      {isMobile ? <Collapse in={filtersOpen}><FiltersBar /></Collapse> : <FiltersBar />}

      {/* MOBILE CARDS */}
      {isMobile ? (
        <Box>
          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Chargement...</Typography>
            </Box>
          )}
          {!loading && rows.map(r => (
            <BlCard key={r.id} r={r} onStatut={handleStatut} onDelete={handleDelete} navigate={navigate} />
          ))}
          {!loading && rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <LocalShipping sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                Aucun bon de livraison trouvé
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre premier BL'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* ── DESKTOP TABLE — no horizontal scroll ────────────────────────── */
        <Box sx={{
          bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2,
          overflow: 'hidden',
          // Force table to respect container width
          '& table': { tableLayout: 'fixed', width: '100%' },
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>

                {/* Numéro */}
                <TableCell sx={{ ...thSx, width: COL.numero.w, pl: 2 }}>Numéro</TableCell>
                {/* Client */}
                <TableCell sx={{ ...thSx, width: COL.client.w }}>Client</TableCell>
                {/* BCC lié */}
                <TableCell sx={{ ...thSx, width: COL.bcc.w }}>BCC lié</TableCell>
                {/* Affaire */}
                <TableCell sx={{ ...thSx, width: COL.affaire.w }}>Affaire</TableCell>
                {/* Dates — fusionnées */}
                <TableCell sx={{ ...thSx, width: COL.dates.w }}>
                  <Box>
                    <span>Livraison</span>
                    <Typography component="span" sx={{ fontSize: '0.52rem', color: TEXT_S, display: 'block', lineHeight: 1, mt: 0.2 }}>
                      réelle / prévue
                    </Typography>
                  </Box>
                </TableCell>
                {/* Montant TTC */}
                <TableCell align="right" sx={{ ...thSx, width: COL.montant.w }}>Montant TTC</TableCell>
                {/* Statut */}
                <TableCell sx={{ ...thSx, width: COL.statut.w }}>Statut</TableCell>
                {/* Actions */}
                <TableCell align="right" sx={{ ...thSx, width: COL.actions.w, pr: 2 }} />

              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: TEXT_S, fontSize: '0.78rem' }}>
                    Chargement...
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.map((r, idx) => {
                const estExpire = dayjs(r.dateLivraison).isBefore(dayjs()) && r.statut === 'en_cours'
                const canEdit   = !['facture', 'annule'].includes(r.statut)
                const canDel    = r.statut !== 'facture'

                return (
                  <TableRow key={r.id} sx={{
                    '&:hover': { bgcolor: SURF3 },
                    borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${SURF2}`,
                    transition: 'background .1s',
                  }}>

                    {/* Numéro */}
                    <TableCell sx={{ pl: 2, py: 1.2 }}>
                      <Typography onClick={() => navigate(`/livraisons/${r.id}`)}
                        sx={{ fontSize: '0.75rem', fontWeight: 700, color: BLUE, cursor: 'pointer',
                          wordBreak: 'break-word', lineHeight: 1.3,
                          '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}>
                        {r.numero}
                      </Typography>
                    </TableCell>

                    {/* Client */}
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: BLUE_DD,
                        fontFamily: 'Outfit', wordBreak: 'break-word', lineHeight: 1.3 }}>
                        {r.clientNom}
                      </Typography>
                    </TableCell>

                    {/* BCC lié */}
                    <TableCell sx={{ py: 1.2 }}>
                      <BccChip
                        numero={r.bonCommandeClientNumero}
                        id={r.bonCommandeClientId}
                        onClick={r.bonCommandeClientId
                          ? () => navigate(`/commandes-client/${r.bonCommandeClientId}`)
                          : undefined}
                      />
                    </TableCell>

                    {/* Affaire */}
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: TEXT_M,
                        wordBreak: 'break-word', lineHeight: 1.3 }}>
                        {r.affaireNom || <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                    </TableCell>

                    {/* Dates fusionnées */}
                    <TableCell sx={{ py: 1.2 }}>
                      <DateCell
                        dateLivraison={r.dateLivraison}
                        dateLivraisonPrevue={r.dateLivraisonPrevue}
                        estExpire={estExpire}
                      />
                    </TableCell>

                    {/* Montant TTC */}
                    <TableCell align="right" sx={{ py: 1.2 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
                        {fmtNum(r.montantTtc)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.58rem', color: TEXT_S }}>MAD</Typography>
                    </TableCell>

                    {/* Statut */}
                    <TableCell sx={{ py: 1.2 }}>
                      <StatutSelect
                        value={r.statut || 'en_cours'}
                        onChange={e => handleStatut(r.id, e.target.value)}
                        tableMode
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ py: 1.2, pr: 1.5 }}>
                      <Stack direction="row" justifyContent="flex-end" gap={0.4}>
                        <Tooltip title="Voir">
                          <IconButton size="small" onClick={() => navigate(`/livraisons/${r.id}`)}
                            sx={{ width: 26, height: 26, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                            <Visibility sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={canEdit ? 'Modifier' : 'Non modifiable'}>
                          <span>
                            <IconButton size="small"
                              onClick={() => navigate(`/livraisons/${r.id}/modifier`)}
                              disabled={!canEdit}
                              sx={{ width: 26, height: 26, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7',
                                '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Edit sx={{ fontSize: 13 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={canDel ? 'Supprimer (restaure le stock)' : 'Non supprimable'}>
                          <span>
                            <IconButton size="small"
                              onClick={() => handleDelete(r.id)}
                              disabled={!canDel}
                              sx={{ width: 26, height: 26, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2',
                                '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Delete sx={{ fontSize: 13 }} />
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
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocalShipping sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                        Aucun bon de livraison trouvé
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre premier BL'}
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
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" sx={{
          '& .MuiPaginationItem-root': { fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px', color: TEXT_M, fontFamily: 'Outfit', '&:hover': { bgcolor: BG_PAGE, color: BLUE } },
          '& .Mui-selected': { bgcolor: `${BLUE} !important`, color: 'white !important' },
        }} />
      </Box>

    </Box>
  )
}

// ── Shared header cell style ──────────────────────────────────────────────────
const thSx = {
  fontSize: '0.6rem', fontWeight: 700, color: TEXT_S,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  borderBottom: `1px solid ${BORDER}`, py: 1.2, px: 1.5,
  fontFamily: 'Outfit', whiteSpace: 'nowrap', overflow: 'hidden',
}