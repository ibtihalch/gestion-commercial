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
import bonCommandeFournisseurService from '../../../services/Boncommandefournisseurservice'
import fournisseurService            from '../../../services/fournisseurService'
import { useAuth }                   from '../../../context/AuthContext'
import toast                         from 'react-hot-toast'
import dayjs                         from 'dayjs'

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
  recu    : { bg: '#dbeafe', color: '#1e40af',  border: '#bfdbfe' },
  facture : { bg: '#dcfce7', color: '#166534',  border: '#bbf7d0' },
}

const STATUT_LABEL = {
  en_cours: 'En cours',
  recu    : 'Reçu',
  facture : 'Facturé',
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

// ── Mobile Card ────────────────────────────────────────────────────────────────
const BcfCard = ({ r, onStatut, onDelete, navigate }) => {
  const estEnRetard =
    r.dateLivraisonPrevue &&
    dayjs(r.dateLivraisonPrevue).isBefore(dayjs()) &&
    r.statut === 'en_cours'

  return (
    <Card sx={{
      border: `1px solid ${BORDER}`, borderRadius: '12px', mb: 1.5,
      boxShadow: 'none', transition: 'box-shadow .15s',
      '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
    }}>
      <CardContent sx={{ p: '12px 14px !important' }}>
        {/* Ligne 1 : numéro + statut + actions */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
          <Stack direction="row" alignItems="center" gap={1} flex={1} minWidth={0}>
            <Typography
              onClick={() => navigate(`/commandes-fournisseur/${r.id}`)}
              sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE, cursor: 'pointer', '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}
            >
              {r.numero}
            </Typography>
            <StatutChip value={r.statut || 'en_cours'} />
          </Stack>
          <Stack direction="row" gap={0.5} flexShrink={0}>
            <Tooltip title="Voir">
              <IconButton size="small" onClick={() => navigate(`/commandes-fournisseur/${r.id}`)}
                sx={{ width: 28, height: 28, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                <Visibility sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier">
              <span>
                <IconButton size="small" onClick={() => navigate(`/commandes-fournisseur/${r.id}/modifier`)}
                  disabled={r.statut === 'facture'}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                  <Edit sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Supprimer">
              <span>
                <IconButton size="small" onClick={() => onDelete(r.id)}
                  disabled={r.statut === 'facture'}
                  sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                  <Delete sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Fournisseur + affaire */}
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD, mb: 0.2, fontFamily: 'Outfit' }}>
          {r.fournisseurNom}
        </Typography>
        {r.affaireNom && (
          <Typography sx={{ fontSize: '0.68rem', color: TEXT_S, mb: 0.6 }}>{r.affaireNom}</Typography>
        )}

        <Divider sx={{ my: 0.8, borderColor: SURF2 }} />

        {/* Dates + montants */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>
              Commande / Livraison
            </Typography>
            <Typography sx={{ fontSize: '0.70rem', color: TEXT_M }}>
              {r.dateCommande ? dayjs(r.dateCommande).format('DD/MM/YY') : '—'}
              {r.dateLivraisonPrevue && (
                <>
                  <span style={{ color: TEXT_S, margin: '0 4px' }}>/</span>
                  <span style={{ color: estEnRetard ? '#ef4444' : TEXT_M, fontWeight: estEnRetard ? 600 : 400 }}>
                    {dayjs(r.dateLivraisonPrevue).format('DD/MM/YY')}
                  </span>
                  {estEnRetard && (
                    <Box component="span" sx={{
                      ml: 0.5, fontSize: '0.55rem', fontWeight: 700, px: '6px', py: '1px',
                      borderRadius: '4px', bgcolor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                      verticalAlign: 'middle',
                    }}>
                      Retard
                    </Box>
                  )}
                </>
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

        {/* Changement statut */}
        <Box mt={1}>
          <FormControl size="small" fullWidth>
            <Select
              value={r.statut || 'en_cours'}
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
export default function CommandesFournisseurPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall   = useMediaQuery(theme.breakpoints.down('sm'))

  const [rows,          setRows]          = useState([])
  const [page,          setPage]          = useState(1)
  const [totalPages,    setTotalPages]    = useState(1)
  const [loading,       setLoading]       = useState(false)
  const [fournisseurs,  setFournisseurs]  = useState([])

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(!isMobile)
  const [filters, setFilters] = useState({
    search: '', statut: '', fournisseurId: '', dateDebut: '', dateFin: '',
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const resetFilters = () => { setFilters({ search: '', statut: '', fournisseurId: '', dateDebut: '', dateFin: '' }); setPage(1) }
  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1) }

  // ── Chargement fournisseurs ────────────────────────────────────────────────
  useEffect(() => {
    fournisseurService.getAll({ size: 200, entrepriseId: user?.entrepriseId })
      .then(d => setFournisseurs(d.content || []))
      .catch(() => {})
  }, [user?.entrepriseId])

  // ── Chargement données ─────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true)
    const params = {
      page: page - 1, size: 10, entrepriseId: user?.entrepriseId,
      ...(filters.search         && { search:         filters.search         }),
      ...(filters.statut         && { statut:         filters.statut         }),
      ...(filters.fournisseurId  && { fournisseurId:  filters.fournisseurId  }),
      ...(filters.dateDebut      && { dateDebut:      filters.dateDebut      }),
      ...(filters.dateFin        && { dateFin:        filters.dateFin        }),
    }
    bonCommandeFournisseurService.getAll(params)
      .then(d => { setRows(d.content || []); setTotalPages(d.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [page, filters, user?.entrepriseId])

  useEffect(() => { load() }, [load])

  const handleStatut = async (id, statut) => {
    try   { await bonCommandeFournisseurService.updateStatut(id, statut); toast.success('Statut mis à jour'); load() }
    catch { toast.error('Erreur changement statut') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de commande fournisseur ?')) return
    try   { await bonCommandeFournisseurService.delete(id); toast.success('Bon de commande supprimé'); load() }
    catch { toast.error('Erreur suppression') }
  }

  // ── Barre de filtres ───────────────────────────────────────────────────────
  const FiltersBar = () => (
    <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">

        {/* Recherche */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            placeholder="Numéro, fournisseur, affaire..."
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

        {/* Statut */}
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

        {/* Fournisseur */}
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <Select
              value={filters.fournisseurId}
              onChange={e => setFilter('fournisseurId', e.target.value)}
              displayEmpty
              renderValue={v => v
                ? <Typography sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fournisseurs.find(f => f.id === v)?.nom || v}
                  </Typography>
                : <Typography sx={{ fontSize: '0.78rem', color: TEXT_S }}>Fournisseur</Typography>
              }
              sx={{
                borderRadius: '8px', bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLUE, borderWidth: 1.5 },
              }}
            >
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Tous</em></MenuItem>
              {fournisseurs.map(f => (
                <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.8rem' }}>{f.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Date début */}
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date" size="small" fullWidth label="Du"
            value={filters.dateDebut}
            onChange={e => setFilter('dateDebut', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={sx_input}
          />
        </Grid>

        {/* Date fin */}
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date" size="small" fullWidth label="Au"
            value={filters.dateFin}
            onChange={e => setFilter('dateFin', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={sx_input}
          />
        </Grid>

        {/* Reset */}
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

      {/* BANDE DÉGRADÉ */}
      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingCart sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Bons de commande fournisseur
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              {rows.length > 0 ? `${rows.length} commandes chargées` : 'Liste de vos bons de commande fournisseur'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1}>
          {/* Bouton filtres mobile avec badge */}
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

          <Button
            onClick={() => navigate('/commandes-fournisseur/nouveau')}
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
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouveau bon de commande'}
          </Button>
        </Stack>
      </Stack>

      {/* FILTRES — collapse sur mobile, toujours visible desktop */}
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
            <BcfCard key={r.id} r={r} onStatut={handleStatut} onDelete={handleDelete} navigate={navigate} />
          ))}
          {!loading && rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <ShoppingCart sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                Aucun bon de commande fournisseur trouvé
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {activeFilterCount > 0 ? 'Modifiez vos filtres' : 'Créez votre premier bon de commande'}
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
                  { label: 'Numéro',      align: 'left',  width: '11%' },
                  { label: 'Fournisseur', align: 'left',  width: '20%' },
                  { label: 'Affaire',     align: 'left',  width: '16%' },
                  { label: 'Dates',       align: 'left',  width: '16%' },
                  { label: 'Montants',    align: 'right', width: '16%' },
                  { label: 'Statut',      align: 'left',  width: '13%' },
                  { label: '',            align: 'right', width: '8%'  },
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
                    Chargement...
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.map((r, idx) => {
                const estEnRetard =
                  r.dateLivraisonPrevue &&
                  dayjs(r.dateLivraisonPrevue).isBefore(dayjs()) &&
                  r.statut === 'en_cours'

                return (
                  <TableRow key={r.id} sx={{
                    '&:hover': { bgcolor: SURF3 },
                    borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${SURF2}`,
                    transition: 'background .1s',
                  }}>

                    {/* Numéro */}
                    <TableCell sx={{ px: 2.5, py: 1.4 }}>
                      <Typography onClick={() => navigate(`/commandes-fournisseur/${r.id}`)}
                        sx={{ fontSize: '0.76rem', fontWeight: 700, color: BLUE, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { color: BLUE_D, textDecoration: 'underline' } }}>
                        {r.numero}
                      </Typography>
                    </TableCell>

                    {/* Fournisseur */}
                    <TableCell sx={{ py: 1.4, px: 1.5, overflow: 'hidden' }}>
                      <Typography noWrap sx={{ fontSize: '0.76rem', fontWeight: 600, color: BLUE_DD, fontFamily: 'Outfit' }}>
                        {r.fournisseurNom}
                      </Typography>
                    </TableCell>

                    {/* Affaire */}
                    <TableCell sx={{ py: 1.4, px: 1.5, overflow: 'hidden' }}>
                      <Typography noWrap sx={{ fontSize: '0.74rem', color: TEXT_M }}>
                        {r.affaireNom || <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                    </TableCell>

                    {/* Dates fusionnées : commande + livraison */}
                    <TableCell sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>
                        {r.dateCommande ? dayjs(r.dateCommande).format('DD/MM/YY') : <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                      {r.dateLivraisonPrevue && (
                        <Stack direction="row" alignItems="center" gap={0.5} mt={0.2}>
                          <Typography sx={{ fontSize: '0.70rem', color: estEnRetard ? '#ef4444' : TEXT_S, fontWeight: estEnRetard ? 600 : 400 }}>
                            {dayjs(r.dateLivraisonPrevue).format('DD/MM/YY')}
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

                    {/* Montants fusionnés : HT + TTC */}
                    <TableCell align="right" sx={{ py: 1.2, px: 1.5 }}>
                      <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>
                        {fmt(r.montantTtc)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: TEXT_S, fontFamily: 'monospace' }}>
                        {fmt(r.montantHt)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.4 }}>
                      <FormControl size="small">
                        <Select
                          value={r.statut || 'en_cours'}
                          onChange={e => handleStatut(r.id, e.target.value)}
                          renderValue={v => <StatutChip value={v} />}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            '& .MuiSelect-select': { p: '0 !important' },
                            '& .MuiSelect-icon': { color: TEXT_S, fontSize: 16, right: -2 },
                            bgcolor: 'transparent', minWidth: 120,
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

                    <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                      <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="Voir">
                          <IconButton size="small" onClick={() => navigate(`/commandes-fournisseur/${r.id}`)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: '#0c4a6e', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}>
                            <Visibility sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <span>
                            <IconButton size="small" onClick={() => navigate(`/commandes-fournisseur/${r.id}/modifier`)}
                              disabled={r.statut === 'facture'}
                              sx={{ width: 28, height: 28, borderRadius: '6px', color: '#92400e', bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' }, '&.Mui-disabled': { opacity: 0.3 } }}>
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <span>
                            <IconButton size="small" onClick={() => handleDelete(r.id)}
                              disabled={r.statut === 'facture'}
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
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                        Aucun bon de commande fournisseur trouvé
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

    </Box>
  )
}