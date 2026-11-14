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
  Add, Edit, Delete, Visibility, ShoppingCart,
  Search, FilterList, Clear,
} from '@mui/icons-material'
import bonCommandeClientService from '../../../services/bonCommandeClientService'
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
  en_cours: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  livre   : { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  facture : { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
}
const STATUT_LABEL = {
  en_cours: 'En cours',
  livre   : 'Livré',
  facture : 'Facturé',
}

// ✅ livre/facture = gérés automatiquement → lecture seule
// en_cours = seul statut modifiable manuellement
const STATUTS_MANUELS = ['en_cours', 'livre', 'facture']  // tous affichables manuellement

// ✅ Éditable seulement si en_cours
const estEditable    = (s) => s === 'en_cours'
const estSupprimable = (s) => s === 'en_cours'

const TOOLTIP_AUTO = {
  livre  : 'Livré automatiquement (BL créé)',
  facture: 'Facturé automatiquement (BF créée)',
}

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
  const s = STATUT_STYLE[value] || { bg: SURF2, color: TEXT_M, border: BORDER }
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

// ── StatutSelect ───────────────────────────────────────────────────────────────
// livre/facture → chip + tooltip "automatique" mais AUSSI modifiable si besoin
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
            '& .MuiSelect-select': { p: '0 !important' },
            '& .MuiSelect-icon': { color: TEXT_S, fontSize: 16, right: -2 },
            bgcolor: 'transparent', minWidth: 110,
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

// ── Mobile Card ────────────────────────────────────────────────────────────────
const BccCard = ({ r, onStatut, onDelete, navigate }) => (
  <Card sx={{
    border: `1px solid ${BORDER}`, borderRadius: '12px', mb: 1.5,
    boxShadow: 'none', transition: 'box-shadow .15s',
    '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
  }}>
    <CardContent sx={{ p: '12px 14px !important' }}>

      {/* Ligne 1 : numéro + statut */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
        <Stack direction="row" alignItems="center" gap={1} flex={1} minWidth={0}>
          <Typography
            onClick={() => navigate(`/commandes-client/${r.id}`)}
            sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE, cursor: 'pointer',
              '&:hover': { color: BLUE_D, textDecoration: 'underline' }, whiteSpace: 'nowrap' }}
          >
            {r.numero}
          </Typography>
          <StatutChip value={r.statut || 'en_cours'} />
        </Stack>
        {/* Actions alignées */}
        <Stack direction="row" gap={0.5} flexShrink={0} ml={1}>
          <Tooltip title="Voir">
            <IconButton size="small" onClick={() => navigate(`/commandes-client/${r.id}`)}
              sx={{ width: 30, height: 30, borderRadius: '7px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
              <Visibility sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={estEditable(r.statut) ? 'Modifier' : 'Non modifiable'}>
            <span>
              <IconButton size="small"
                onClick={() => navigate(`/commandes-client/${r.id}/modifier`)}
                disabled={!estEditable(r.statut)}
                sx={{ width: 30, height: 30, borderRadius: '7px', color: '#92400e', bgcolor: '#fef3c7',
                  '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.35 } }}>
                <Edit sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={estSupprimable(r.statut) ? 'Supprimer' : 'Non supprimable'}>
            <span>
              <IconButton size="small"
                onClick={() => onDelete(r.id)}
                disabled={!estSupprimable(r.statut)}
                sx={{ width: 30, height: 30, borderRadius: '7px', color: '#ef4444', bgcolor: '#fef2f2',
                  '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.35 } }}>
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Client */}
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD, mb: 0.1, fontFamily: 'Outfit' }}>
        {r.clientNom}
      </Typography>

      {/* Affaire + Devis */}
      <Stack direction="row" gap={1.5} flexWrap="wrap" mb={0.5}>
        {r.affaireNom && (
          <Typography sx={{ fontSize: '0.68rem', color: TEXT_S }}>
            📁 {r.affaireNom}
          </Typography>
        )}
        {r.devisNumero && (
          <Typography sx={{ fontSize: '0.68rem', color: BLUE, fontWeight: 500 }}>
            📄 {r.devisNumero}
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 0.8, borderColor: SURF2 }} />

      {/* Dates + Montants */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={1}>
        <Box>
          <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
            Commande
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#334155', fontWeight: 500 }}>
            {r.dateCommande ? dayjs(r.dateCommande).format('DD/MM/YYYY') : '—'}
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

      {/* Changement statut */}
      <StatutSelect value={r.statut} onChange={e => onStatut(r.id, e.target.value)} />

    </CardContent>
  </Card>
)

// ══════════════════════════════════════════════════════════════════════════════
export default function CommandesClientPage() {
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

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(!isMobile)
  const [filters, setFilters] = useState({
    search: '', statut: '', clientId: '', affaireId: '', dateDebut: '', dateFin: '',
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const resetFilters = () => { setFilters({ search: '', statut: '', clientId: '', affaireId: '', dateDebut: '', dateFin: '' }); setPage(1) }
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
    bonCommandeClientService.getAll(params)
      .then(d => { setRows(d.content || []); setTotalPages(d.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [page, filters, user?.entrepriseId])

  useEffect(() => { load() }, [load])

  const handleStatut = async (id, statut) => {
    try   { await bonCommandeClientService.updateStatut(id, statut); toast.success('Statut mis à jour'); load() }
    catch { toast.error('Erreur changement statut') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de commande ?')) return
    try   { await bonCommandeClientService.delete(id); toast.success('Supprimé'); load() }
    catch { toast.error('Erreur suppression') }
  }

  // ── Barre de filtres ───────────────────────────────────────────────────────
  const FiltersBar = () => (
    <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            placeholder="Numéro, client, affaire..."
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

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Box>
      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingCart sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Bons de commande client
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              {rows.length > 0 ? `${rows.length} commandes chargées` : 'Liste de vos bons de commande'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1}>
          {isMobile && (
            <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <IconButton onClick={() => setFiltersOpen(v => !v)}
                sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: filtersOpen ? BG_PAGE : 'white', border: `1px solid ${BORDER}`, color: filtersOpen ? BLUE : TEXT_M }}>
                <FilterList sx={{ fontSize: 18 }} />
              </IconButton>
            </Badge>
          )}
          <Button onClick={() => navigate('/commandes-client/nouveau')}
            startIcon={!isSmall && <Add sx={{ fontSize: '16px !important' }} />}
            sx={{ bgcolor: BLUE, color: 'white', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
              textTransform: 'none', px: { xs: 1.5, md: 2 }, py: 0.8, fontFamily: 'Outfit',
              minWidth: isSmall ? 36 : 'auto', boxShadow: `0 4px 12px ${BLUE}30`, '&:hover': { bgcolor: BLUE_D } }}>
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouveau bon de commande'}
          </Button>
        </Stack>
      </Stack>

      {isMobile ? <Collapse in={filtersOpen}><FiltersBar /></Collapse> : <FiltersBar />}

      {/* MOBILE CARDS */}
      {isMobile ? (
        <Box>
          {loading && <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Chargement...</Typography></Box>}
          {!loading && rows.map(r => (
            <BccCard key={r.id} r={r} onStatut={handleStatut} onDelete={handleDelete} navigate={navigate} />
          ))}
          {!loading && rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <ShoppingCart sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucun bon de commande trouvé</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre premier bon de commande'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* ── DESKTOP TABLE ───────────────────────────────────────────────── */
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {[
                  { label: 'Numéro',      align: 'left'  },
                  { label: 'Client',      align: 'left'  },
                  { label: 'Affaire',     align: 'left'  },
                  { label: 'Devis',       align: 'left'  },
                  { label: 'Commande',    align: 'left'  },
                  { label: 'Livraison',   align: 'left'  },
                 
                  { label: 'Montant TTC', align: 'right' },
                  { label: 'Statut',      align: 'left'  },
                  { label: '',            align: 'right' },
                ].map(({ label, align }, i) => (
                  <TableCell key={i} align={align} sx={{
                    fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.5,
                    px: i === 0 ? 2.5 : 2, fontFamily: 'Outfit', whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: TEXT_S, fontSize: '0.78rem' }}>
                    Chargement...
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.map((r, idx) => (
                <TableRow key={r.id} sx={{
                  '&:hover': { bgcolor: SURF3 },
                  borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${SURF2}`,
                  transition: 'background .1s',
                }}>

                  {/* Numéro */}
                  <TableCell sx={{ px: 2.5, py: 1.4 }}>
                    <Typography onClick={() => navigate(`/commandes-client/${r.id}`)}
                      sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE, cursor: 'pointer',
                        '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}>
                      {r.numero}
                    </Typography>
                  </TableCell>

                  {/* Client */}
                  <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600, color: BLUE_DD, py: 1.4, fontFamily: 'Outfit' }}>
                    {r.clientNom}
                  </TableCell>

                  {/* Affaire */}
                  <TableCell sx={{ fontSize: '0.76rem', color: TEXT_M, py: 1.4 }}>
                    {r.affaireNom || <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  {/* Devis source */}
                  <TableCell sx={{ py: 1.4 }}>
                    {r.devisNumero
                      ? <Typography sx={{ fontSize: '0.74rem', color: BLUE, fontWeight: 500 }}>{r.devisNumero}</Typography>
                      : <span style={{ color: '#c7d4e8', fontSize: '0.74rem' }}>—</span>}
                  </TableCell>

                  {/* Date commande */}
                  <TableCell sx={{ py: 1.4 }}>
                    {r.dateCommande ? (
                      <Box>
                        <Typography sx={{ fontSize: '0.76rem', color: '#334155', fontWeight: 500, lineHeight: 1.3 }}>
                          {dayjs(r.dateCommande).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, lineHeight: 1.2 }}>
                          {dayjs(r.dateCommande).format('ddd')}
                        </Typography>
                      </Box>
                    ) : <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  {/* Date livraison */}
                  <TableCell sx={{ py: 1.4 }}>
                    {r.dateLivraisonPrevue ? (
                      <Box>
                        <Typography sx={{ fontSize: '0.76rem', color: '#334155', fontWeight: 500, lineHeight: 1.3 }}>
                          {dayjs(r.dateLivraisonPrevue).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, lineHeight: 1.2 }}>
                          {dayjs(r.dateLivraisonPrevue).format('ddd')}
                        </Typography>
                      </Box>
                    ) : <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>


                  {/* Montant TTC */}
                  <TableCell align="right" sx={{ py: 1.4 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
                      {fmtNum(r.montantTtc)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: TEXT_S }}>MAD</Typography>
                  </TableCell>

                  {/* Statut — modifiable manuellement pour tous les statuts */}
                  <TableCell sx={{ py: 1.4 }}>
                    <StatutSelect
                      value={r.statut || 'en_cours'}
                      onChange={e => handleStatut(r.id, e.target.value)}
                      tableMode
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                    <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => navigate(`/commandes-client/${r.id}`)}
                          sx={{ width: 28, height: 28, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                          <Visibility sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={estEditable(r.statut) ? 'Modifier' : 'Non modifiable'}>
                        <span>
                          <IconButton size="small"
                            onClick={() => navigate(`/commandes-client/${r.id}/modifier`)}
                            disabled={!estEditable(r.statut)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7',
                              '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={estSupprimable(r.statut) ? 'Supprimer' : 'Non supprimable'}>
                        <span>
                          <IconButton size="small"
                            onClick={() => handleDelete(r.id)}
                            disabled={!estSupprimable(r.statut)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2',
                              '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                            <Delete sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>

                </TableRow>
              ))}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                        Aucun bon de commande trouvé
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre premier bon de commande'}
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