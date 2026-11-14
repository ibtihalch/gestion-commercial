import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, TextField, Pagination,
  Dialog, DialogContent, Stack, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Tooltip,
  useTheme, useMediaQuery, Card, CardContent, Divider, Grid
} from '@mui/material'
import {
  Add, Search, History, FileDownload,
  TrendingUp, TrendingDown, Inventory2Outlined, Warning, Clear, Close
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import mouvementStockService from '../../services/mouvementStockService'
import articleService from '../../services/articleService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'
const BG_PAGE = '#EEF2FB'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURF2   = '#f1f5f9'
const SURF3   = '#fafbfe'

const fmt = (n) => Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })

const isAlerte = (a) => Number(a.stock ?? 0) <= Number(a.seuilAlerte ?? 0)

const getStockLevel = (a) => {
  if (isAlerte(a)) return { label: 'Alerte', key: 'low' }
  const qte = a.stock ?? 0
  if (qte < 50) return { label: 'Moyen', key: 'mid' }
  return { label: 'Élevé', key: 'high' }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, value, label, iconBg, iconColor, valueColor }) => (
  <Box sx={{
    bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2,
    p: '14px 16px', display: 'flex', alignItems: 'center', gap: 1.5,
  }}>
    <Box sx={{
      width: 36, height: 36, borderRadius: '8px', bgcolor: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon sx={{ fontSize: 18, color: iconColor }} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: valueColor || BLUE_DD, lineHeight: 1, letterSpacing: '-0.01em' }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: TEXT_S, mt: 0.3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
    </Box>
  </Box>
)

const fieldSx = {
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

const SelectField = ({ label, value, onChange, children, disabled }) => (
  <FormControl fullWidth size="small" disabled={disabled}>
    <InputLabel sx={{ fontSize: '0.78rem', color: TEXT_M, '&.Mui-focused': { color: BLUE } }}>
      {label}
    </InputLabel>
    <Select value={value} onChange={onChange} label={label} sx={{
      borderRadius: '8px', fontSize: '0.82rem',
      '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BLUE + '60' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BLUE, borderWidth: 1.5 },
    }}>
      {children}
    </Select>
  </FormControl>
)

// ── Mobile Stock Card ──────────────────────────────────────────────────────────
const StockCard = ({ a, mouvements, onMouvement, onHist }) => {
  const alerte = isAlerte(a)
  const level  = getStockLevel(a)
  const nbMvt  = mouvements.filter(m => m.articleId === a.id).length

  return (
    <Card sx={{
      border: `1px solid ${alerte ? ORANGE + '40' : BORDER}`,
      borderRadius: '12px', mb: 1.5,
      bgcolor: alerte ? '#FFFBEB' : 'white',
      boxShadow: 'none',
      '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
    }}>
      <CardContent sx={{ p: '12px 14px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} mr={1}>
            <Stack direction="row" alignItems="center" gap={0.8} mb={0.5} flexWrap="wrap">
              {alerte && <Warning sx={{ fontSize: 13, color: ORANGE }} />}
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE, fontFamily: 'monospace' }}>
                {a.code}
              </Typography>
              {a.unite && (
                <Box sx={{ bgcolor: BG_PAGE, borderRadius: '5px', px: 0.8, py: 0.2, border: `1px solid ${BLUE}20` }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: BLUE_D, fontFamily: 'monospace' }}>{a.unite}</Typography>
                </Box>
              )}
              {a.familleLibelle && (
                <Chip label={a.familleLibelle} size="small" sx={{ fontSize: '0.58rem', height: 16, borderRadius: '4px', bgcolor: BG_PAGE, color: BLUE_D, fontWeight: 600, border: `1px solid ${BLUE}20` }} />
              )}
              {a.sousFamilleLibelle && (
                <Chip label={a.sousFamilleLibelle} size="small" sx={{ fontSize: '0.58rem', height: 16, borderRadius: '4px', bgcolor: SURF2, color: BLUE_DD, fontWeight: 600, border: `1px solid ${BORDER}` }} />
              )}
            </Stack>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: alerte ? '#92400E' : BLUE_DD, mb: 0.6, lineHeight: 1.3, fontFamily: 'Outfit' }}>
              {a.designation}
            </Typography>
            <Stack direction="row" gap={0.8} flexWrap="wrap">
              <Chip label={`Stock: ${a.stock ?? 0}`} size="small" sx={{
                fontSize: '0.62rem', height: 18, borderRadius: '5px',
                bgcolor: alerte ? '#FEF3C7' : BG_PAGE,
                color: alerte ? '#92400E' : BLUE_D,
                border: `1px solid ${alerte ? ORANGE + '50' : BLUE + '20'}`,
              }} />
              <Chip label={`Seuil: ${a.seuilAlerte ?? 0}`} size="small" sx={{
                fontSize: '0.62rem', height: 18, borderRadius: '5px',
                bgcolor: SURF2, color: TEXT_M, border: `1px solid ${BORDER}`,
              }} />
              <Box sx={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: '0.62rem', fontWeight: 700, px: 0.9, py: 0.3, borderRadius: '6px',
                ...(level.key === 'low'  ? { bgcolor: '#FFFBEB', color: '#92400E', border: `1px solid ${ORANGE}40` } :
                    level.key === 'mid'  ? { bgcolor: BG_PAGE,   color: BLUE_D,   border: `1px solid ${BLUE}30`   } :
                                           { bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0'     }),
              }}>
                {level.label}
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" gap={0.5} flexShrink={0}>
            <IconButton size="small" onClick={() => onHist(a)} sx={{ width: 30, height: 30, borderRadius: '7px', color: TEXT_M, bgcolor: SURF2, '&:hover': { bgcolor: BG_PAGE, color: BLUE } }}>
              <History sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onMouvement(a)} sx={{ width: 30, height: 30, borderRadius: '7px', color: '#059669', bgcolor: '#dcfce7', '&:hover': { bgcolor: '#bbf7d0' } }}>
              <Add sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        </Stack>
        <Divider sx={{ my: 1, borderColor: SURF2 }} />
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, mb: 0.2 }}>Prix achat</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: TEXT_M }}>{fmt(a.prixAchat)} MAD</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, mb: 0.2, textAlign: 'center' }}>Mvts</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: BLUE_D, textAlign: 'center' }}>{nbMvt || '—'}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, mb: 0.2 }}>Prix vente</Typography>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: BLUE_D }}>{fmt(a.prixVente)} MAD</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function StockPage() {
  const { user }   = useAuth()
  const theme      = useTheme()
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall    = useMediaQuery(theme.breakpoints.down('sm'))

  const [articles,        setArticles]        = useState([])
  const [filtered,        setFiltered]        = useState([])
  const [search,          setSearch]          = useState('')
  const [onlyAlerte,      setOnlyAlerte]      = useState(false)
  const [page,            setPage]            = useState(1)
  const [totalPages,      setTotalPages]      = useState(1)
  const [mouvements,      setMouvements]      = useState([])
  const [open,            setOpen]            = useState(false)
  const [openHist,        setOpenHist]        = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [exporting,       setExporting]       = useState(false)

  // ── Filtres famille / sous-famille ─────────────────────────────────────────
  const [familles,        setFamilles]        = useState([])
  const [allSousFamilles, setAllSousFamilles] = useState([])
  const [filterSousFam,   setFilterSousFam]   = useState([])
  const [familleId,       setFamilleId]       = useState('')
  const [sousFamilleId,   setSousFamilleId]   = useState('')

  const [form, setForm] = useState({
    articleId: '', typeMouvement: 'entree', qte: 1,
    referenceDocument: '', observations: '',
  })

  const PAGE_SIZE = 10

  // ── Chargement articles ────────────────────────────────────────────────────
  const loadArticles = () => {
    articleService.getAll({ page: 0, size: 500, entrepriseId: user?.entrepriseId })
      .then(d => { setArticles(d.content || []); setFiltered(d.content || []) })
      .catch(() => toast.error('Erreur de chargement'))
  }

  useEffect(() => { loadArticles() }, [])

  // ── Chargement familles & sous-familles ────────────────────────────────────
  useEffect(() => {
    articleService.getAllFamilles({ size: 200, entrepriseId: user?.entrepriseId })
      .then(data => setFamilles(data.content || data || []))
      .catch(() => {})
    articleService.getAllSousFamilles({ size: 500, entrepriseId: user?.entrepriseId })
      .then(data => {
        const list = data.content || data || []
        setAllSousFamilles(list)
        setFilterSousFam(list)
      })
      .catch(() => {})
  }, [user?.entrepriseId])

  // ── Mise à jour sous-familles selon famille sélectionnée ──────────────────
  useEffect(() => {
    if (familleId) {
      setFilterSousFam(allSousFamilles.filter(sf =>
        String(sf.familleId) === String(familleId)
      ))
      setSousFamilleId('')
    } else {
      setFilterSousFam(allSousFamilles)
      setSousFamilleId('')
    }
  }, [familleId, allSousFamilles])

  // ── Filtrage local ─────────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...articles]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.designation?.toLowerCase().includes(q) ||
        a.code?.toLowerCase().includes(q) ||
        String(a.id).includes(q)
      )
    }
    if (familleId) {
      list = list.filter(a => String(a.familleId) === String(familleId))
    }
    if (sousFamilleId) {
      list = list.filter(a => String(a.sousFamilleId) === String(sousFamilleId))
    }
    if (onlyAlerte) list = list.filter(a => isAlerte(a))
    setTotalPages(Math.max(1, Math.ceil(list.length / PAGE_SIZE)))
    setPage(1)
    setFiltered(list)
  }, [search, onlyAlerte, familleId, sousFamilleId, articles])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalArticles  = articles.length
  const stockEnAlerte  = articles.filter(a => isAlerte(a)).length
  const valeurTotale   = articles.reduce((s, a) => s + (a.stock ?? 0) * Number(a.prixAchat || 0), 0)

  const [entreesAujourdhui, setEntreesAujourdhui] = useState(0)
  const [sortiesAujourdhui, setSortiesAujourdhui] = useState(0)

  useEffect(() => {
    mouvementStockService.getAll({ page: 0, size: 200, entrepriseId: user?.entrepriseId })
      .then(d => {
        const today = dayjs().format('YYYY-MM-DD')
        const mv = d.content || []
        setMouvements(mv)
        setEntreesAujourdhui(mv.filter(m => m.typeMouvement === 'entree' && dayjs(m.dateMouvement).format('YYYY-MM-DD') === today).length)
        setSortiesAujourdhui(mv.filter(m => m.typeMouvement === 'sortie' && dayjs(m.dateMouvement).format('YYYY-MM-DD') === today).length)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    try {
      await mouvementStockService.create({ ...form, entrepriseId: user?.entrepriseId, qte: Number(form.qte) })
      toast.success('Mouvement enregistré')
      setOpen(false)
      setForm({ articleId: '', typeMouvement: 'entree', qte: 1, referenceDocument: '', observations: '' })
      loadArticles()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      if (filtered.length === 0) { toast.error('Aucun article à exporter'); return }
      const excelData = filtered.map(a => {
        const level = getStockLevel(a)
        return {
          'Code'         : a.code               || '',
          'Désignation'  : a.designation        || '',
          'Famille'      : a.familleLibelle     || '',
          'Sous-famille' : a.sousFamilleLibelle || '',
          'Unité'        : a.unite              || '',
          'Stock'        : a.stock              ?? 0,
          'Seuil alerte' : a.seuilAlerte        ?? 0,
          'Niveau'       : level.label,
          'Prix achat'   : Number(a.prixAchat   || 0).toFixed(2),
          'Prix vente'   : Number(a.prixVente   || 0).toFixed(2),
          'Valeur stock' : (Number(a.stock ?? 0) * Number(a.prixAchat || 0)).toFixed(2),
          'Statut'       : a.actif ? 'Actif' : 'Inactif',
        }
      })
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      ws['!cols'] = [14, 32, 18, 18, 8, 8, 12, 10, 12, 12, 14, 10].map(wch => ({ wch }))
      XLSX.utils.book_append_sheet(wb, ws, 'Stock')
      const parts = ['Stock']
      if (search)      parts.push(search.replace(/\s+/g, '_'))
      if (onlyAlerte)  parts.push('alerte')
      parts.push(dayjs().format('YYYYMMDD'))
      XLSX.writeFile(wb, `${parts.join('_')}.xlsx`)
      toast.success(`${filtered.length} article(s) exporté(s)`)
    } catch { toast.error("Erreur lors de l'export") }
    finally  { setExporting(false) }
  }

  const histArticle = mouvements.filter(m => m.articleId === selectedArticle?.id)

  const mvtBadgeSx = (type) => ({
    entree     : { bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    sortie     : { bgcolor: '#fef2f2', color: '#991B1B', border: '1px solid #fecaca' },
    ajustement : { bgcolor: '#FFFBEB', color: '#92400E', border: `1px solid ${ORANGE}40` },
  }[type] || {})

  const activeFilterCount = [search, onlyAlerte ? 'alerte' : '', familleId, sousFamilleId].filter(Boolean).length

  const openMouvement = (a) => {
    setForm({ articleId: a.id, typeMouvement: 'entree', qte: 1, referenceDocument: '', observations: '' })
    setOpen(true)
  }

  const handleOpenHist = (a) => {
    setSelectedArticle(a)
    setOpenHist(true)
  }

  const resetFilters = () => {
    setSearch('')
    setFamilleId('')
    setSousFamilleId('')
    setOnlyAlerte(false)
  }

  const COLS = ['Article', 'Unité', 'Stock', 'Prix achat', 'Prix vente', 'Mouvements', 'Niveau', '']

  return (
    <Box>

      {/* BANDE DÉGRADÉ */}
      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2Outlined sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Gestion des stocks
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              Suivi des articles et mouvements
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap">
          <Tooltip title={activeFilterCount > 0 ? 'Exporter les articles filtrés' : 'Exporter tous les articles en Excel'}>
            <Button onClick={handleExport} disabled={exporting}
              startIcon={!isSmall && <FileDownload sx={{ fontSize: '15px !important' }} />}
              sx={{
                bgcolor: '#f0fdf4', color: '#16A34A', border: '1px solid #bbf7d0', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', px: { xs: 1.2, md: 1.8 }, py: 0.8, fontFamily: 'Outfit',
                minWidth: isSmall ? 36 : 'auto',
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' },
                '&.Mui-disabled': { opacity: 0.6 },
              }}>
              {isSmall ? <FileDownload sx={{ fontSize: 18 }} /> : exporting ? 'Export…' : 'Excel'}
            </Button>
          </Tooltip>

          <Button
            onClick={() => { setForm({ articleId: '', typeMouvement: 'ajustement', qte: 0, referenceDocument: '', observations: '' }); setOpen(true) }}
            sx={{
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              color: '#059669', bgcolor: '#dcfce7', borderRadius: '8px',
              px: { xs: 1.2, md: 2 }, py: 0.8, fontFamily: 'Outfit', border: '1px solid #bbf7d0',
              '&:hover': { bgcolor: '#bbf7d0' },
            }}>
            {isSmall ? 'Ajust.' : 'Ajustement'}
          </Button>

          <Button
            startIcon={!isSmall && <Add sx={{ fontSize: '16px !important' }} />}
            onClick={() => { setForm({ articleId: '', typeMouvement: 'entree', qte: 1, referenceDocument: '', observations: '' }); setOpen(true) }}
            sx={{
              bgcolor: BLUE, color: 'white', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              px: { xs: 1.5, md: 2 }, py: 0.8, fontFamily: 'Outfit',
              boxShadow: `0 4px 12px ${BLUE}30`,
              minWidth: isSmall ? 36 : 'auto',
              '&:hover': { bgcolor: BLUE_D },
            }}>
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouveau mouvement'}
          </Button>
        </Stack>
      </Stack>

      {/* KPI GRID */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        <KpiCard icon={Inventory2Outlined} value={totalArticles}     label="Articles total"      iconBg={BG_PAGE}  iconColor={BLUE}    />
        <KpiCard icon={Warning}            value={stockEnAlerte}     label="En alerte"           iconBg="#FFFBEB"  iconColor={ORANGE}  valueColor={stockEnAlerte > 0 ? ORANGE : BLUE_DD} />
        <KpiCard icon={TrendingUp}         value={entreesAujourdhui} label="Entrées aujourd'hui" iconBg="#dcfce7"  iconColor="#059669" valueColor="#059669" />
        <KpiCard icon={TrendingDown}       value={sortiesAujourdhui} label="Sorties aujourd'hui" iconBg="#fef2f2"  iconColor="#ef4444" valueColor="#ef4444" />
      </Box>

      {/* BANDEAU VALEUR TOTALE */}
      <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.2, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: TEXT_M }}>
          Valeur totale du stock :
        </Typography>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: BLUE_D }}>
          {fmt(valeurTotale)} MAD
        </Typography>
      </Box>

      {/* ── FILTRES ──────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">

          {/* Recherche */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              placeholder="Rechercher par nom, code…"
              size="small" value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: TEXT_S }} /></InputAdornment>,
                endAdornment: search
                  ? <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}><Clear sx={{ fontSize: 14 }} /></IconButton>
                    </InputAdornment>
                  : null,
              }}
              sx={fieldSx}
            />
          </Grid>

          {/* Famille */}
          <Grid item xs={6} sm={3} md={2}>
            <SelectField
              label="Famille"
              value={familleId}
              onChange={e => setFamilleId(e.target.value)}
            >
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Toutes</em></MenuItem>
              {familles.map(f => (
                <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.8rem' }}>{f.libelle}</MenuItem>
              ))}
            </SelectField>
          </Grid>

          {/* Sous-famille */}
          <Grid item xs={6} sm={3} md={2}>
            <SelectField
              label="Sous-famille"
              value={sousFamilleId}
              onChange={e => setSousFamilleId(e.target.value)}
              disabled={!familleId}
            >
              <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Toutes</em></MenuItem>
              {filterSousFam.map(sf => (
                <MenuItem key={sf.id} value={sf.id} sx={{ fontSize: '0.8rem' }}>{sf.libelle}</MenuItem>
              ))}
            </SelectField>
          </Grid>

          {/* Switch alerte */}
          <Grid item xs={12} sm="auto">
            <FormControlLabel
              control={
                <Switch checked={onlyAlerte} onChange={e => setOnlyAlerte(e.target.checked)} size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: ORANGE },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ORANGE },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: onlyAlerte ? '#92400E' : TEXT_M, whiteSpace: 'nowrap' }}>
                  Sous seuil d'alerte
                </Typography>
              }
              sx={{
                m: 0, px: 1.5, py: 0.6,
                border: `1px solid ${onlyAlerte ? ORANGE + '50' : BORDER}`,
                borderRadius: '8px',
                bgcolor: onlyAlerte ? '#FFFBEB' : 'white',
                transition: 'all .15s',
              }}
            />
          </Grid>

          {/* Réinitialiser */}
          {activeFilterCount > 0 && (
            <Grid item xs={12} sm="auto">
              <Button onClick={resetFilters} startIcon={<Clear sx={{ fontSize: 14 }} />} size="small" sx={{
                fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', fontFamily: 'Outfit',
                color: TEXT_M, borderRadius: '8px', px: 1.5,
                border: `1px solid ${BORDER}`,
                '&:hover': { bgcolor: SURF2 },
              }}>
                Réinitialiser ({activeFilterCount})
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* ALERTE STOCK */}
      {stockEnAlerte > 0 && (
        <Box sx={{
          bgcolor: '#FFFBEB', border: `1px solid ${ORANGE}40`, borderRadius: 2,
          px: { xs: 1.5, md: 2 }, py: 1.2, mb: 2,
          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
        }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: '#FEF3C7', border: `1px solid ${ORANGE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Warning sx={{ fontSize: 15, color: ORANGE }} />
          </Box>
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#92400E', flex: 1, fontFamily: 'Outfit' }}>
            {stockEnAlerte} article{stockEnAlerte > 1 ? 's' : ''} sous le seuil d'alerte stock
          </Typography>
          <Box sx={{ bgcolor: ORANGE + '18', borderRadius: '6px', px: 1, py: 0.3 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400E', fontFamily: 'Outfit' }}>Réapprovisionnement requis</Typography>
          </Box>
        </Box>
      )}

      {/* ── MOBILE : Cards ── */}
      {isMobile ? (
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={1.5} px={0.5}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {activeFilterCount > 0 ? 'Articles filtrés' : 'Tous les articles'}
            </Typography>
            <Box sx={{ bgcolor: BLUE, color: 'white', fontSize: '0.63rem', fontWeight: 700, px: 1, py: 0.2, borderRadius: '20px' }}>
              {filtered.length}
            </Box>
          </Stack>

          {paginated.map(a => (
            <StockCard key={a.id} a={a} mouvements={mouvements} onMouvement={openMouvement} onHist={handleOpenHist} />
          ))}

          {paginated.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <Inventory2Outlined sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>
                {activeFilterCount > 0 ? 'Aucun résultat pour ces filtres' : 'Aucun article trouvé'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* ── DESKTOP : Table ── */
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ bgcolor: SURF3, borderBottom: `1px solid ${BORDER}`, px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {activeFilterCount > 0 ? 'Articles filtrés' : 'Tous les articles'}
            </Typography>
            <Box sx={{ bgcolor: BLUE, color: 'white', fontSize: '0.63rem', fontWeight: 700, px: 1, py: 0.2, borderRadius: '20px' }}>
              {filtered.length}
            </Box>
          </Box>

          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {COLS.map((h, i) => (
                  <TableCell key={i}
                    align={[2, 3, 4].includes(i) ? 'right' : [1, 5, 6].includes(i) ? 'center' : i === 7 ? 'right' : 'left'}
                    sx={{
                      fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      borderBottom: `1px solid ${BORDER}`, py: 1.5,
                      px: i === 0 ? 2.5 : 1.5, whiteSpace: 'nowrap', fontFamily: 'Outfit',
                      width: ['auto', '7%', '8%', '10%', '10%', '9%', '9%', '8%'][i],
                    }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.map((a, idx) => {
                const alerte = isAlerte(a)
                const level  = getStockLevel(a)
                const nbMvt  = mouvements.filter(m => m.articleId === a.id).length

                return (
                  <TableRow key={a.id} sx={{
                    bgcolor: alerte ? '#FFFBEB' : 'white',
                    '&:hover': { bgcolor: alerte ? '#FEF3C7' : SURF3 },
                    borderBottom: idx === paginated.length - 1 ? 'none' : `1px solid ${SURF2}`,
                    transition: 'background .1s',
                  }}>
                    <TableCell sx={{ px: 2.5, py: 1.3 }}>
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        {alerte && <Warning sx={{ fontSize: 13, color: ORANGE, flexShrink: 0 }} />}
                        <Box overflow="hidden">
                          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: alerte ? '#92400E' : BLUE_DD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.designation || a.nom}
                          </Typography>
                          <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                            <Typography sx={{ fontSize: '0.63rem', color: TEXT_S }}>{a.code}</Typography>
                            {a.familleLibelle && (
                              <Chip label={a.familleLibelle} size="small" sx={{ fontSize: '0.55rem', height: 14, borderRadius: '4px', bgcolor: BG_PAGE, color: BLUE_D, fontWeight: 600, border: `1px solid ${BLUE}20` }} />
                            )}
                            {a.sousFamilleLibelle && (
                              <Chip label={a.sousFamilleLibelle} size="small" sx={{ fontSize: '0.55rem', height: 14, borderRadius: '4px', bgcolor: SURF2, color: BLUE_DD, fontWeight: 600, border: `1px solid ${BORDER}` }} />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 1.3 }}>
                      {a.unite
                        ? <Box sx={{ display: 'inline-block', bgcolor: BG_PAGE, borderRadius: '5px', px: 1, py: 0.2, border: `1px solid ${BLUE}20` }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE_D, fontFamily: 'monospace' }}>{a.unite}</Typography>
                          </Box>
                        : <span style={{ color: '#c7d4e8' }}>—</span>}
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.3 }}>
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 36, height: 24, px: 1, borderRadius: '6px',
                        fontSize: '0.72rem', fontWeight: 700,
                        ...(alerte
                          ? { bgcolor: '#FFFBEB', color: '#92400E', border: `1px solid ${ORANGE}50` }
                          : (a.stock ?? 0) < 50
                          ? { bgcolor: BG_PAGE,   color: BLUE_D,   border: `1px solid ${BLUE}30` }
                          : { bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
                        ),
                      }}>
                        {a.stock ?? 0}
                      </Box>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.3 }}>
                      <Typography sx={{ fontSize: '0.74rem', color: TEXT_M, fontFamily: 'Outfit' }}>
                        {a.prixAchat ? fmt(a.prixAchat) : <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.3 }}>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: BLUE_D, fontFamily: 'Outfit' }}>
                        {a.prixVente ? fmt(a.prixVente) : <span style={{ color: '#c7d4e8' }}>—</span>}
                      </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 1.3 }}>
                      {nbMvt > 0
                        ? <Box sx={{ display: 'inline-block', bgcolor: BG_PAGE, borderRadius: '6px', px: 0.9, py: 0.2 }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE_D }}>{nbMvt}</Typography>
                          </Box>
                        : <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8' }}>—</Typography>
                      }
                    </TableCell>

                    <TableCell align="center" sx={{ py: 1.3 }}>
                      <Box sx={{
                        display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                        px: 1, py: 0.3, borderRadius: '6px',
                        ...(level.key === 'low'  ? { bgcolor: '#FFFBEB', color: '#92400E', border: `1px solid ${ORANGE}40` } :
                            level.key === 'mid'  ? { bgcolor: BG_PAGE,   color: BLUE_D,   border: `1px solid ${BLUE}30`   } :
                                                   { bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0'     }),
                      }}>
                        {level.label}
                      </Box>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.3, pr: 2 }}>
                      <Stack direction="row" gap={0.5} justifyContent="flex-end">
                        <Tooltip title="Historique">
                          <IconButton size="small" onClick={() => handleOpenHist(a)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: TEXT_M, bgcolor: SURF2, '&:hover': { bgcolor: BG_PAGE, color: BLUE } }}>
                            <History sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Nouveau mouvement">
                          <IconButton size="small" onClick={() => openMouvement(a)}
                            sx={{ width: 28, height: 28, borderRadius: '6px', color: '#059669', bgcolor: '#dcfce7', '&:hover': { bgcolor: '#bbf7d0' } }}>
                            <Add sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Inventory2Outlined sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucun article trouvé</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {activeFilterCount > 0 ? 'Modifiez votre recherche ou désactivez les filtres' : 'Ajoutez des articles au catalogue'}
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
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small"
          sx={{
            '& .MuiPaginationItem-root': { fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px', color: TEXT_M, fontFamily: 'Outfit', '&:hover': { bgcolor: BG_PAGE, color: BLUE } },
            '& .Mui-selected': { bgcolor: `${BLUE} !important`, color: 'white !important' },
          }}
        />
      </Box>

      {/* ══ DIALOG — Nouveau mouvement ═══════════════════════════════════════ */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isSmall}
        PaperProps={{ sx: { borderRadius: isSmall ? 0 : '14px', border: isSmall ? 'none' : `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, borderBottom: `1px solid ${SURF2}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD, fontFamily: 'Outfit' }}>Nouveau mouvement de stock</Typography>
            <Typography sx={{ fontSize: '0.63rem', color: TEXT_S, fontFamily: 'Outfit' }}>Renseignez les informations du mouvement</Typography>
          </Box>
          {isSmall && <IconButton onClick={() => setOpen(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>}
        </Box>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
          <Stack spacing={1.8}>
            <FormControl fullWidth size="small" required sx={fieldSx}>
              <InputLabel>Article</InputLabel>
              <Select value={form.articleId} label="Article" onChange={e => setForm({ ...form, articleId: e.target.value })}>
                {articles.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    <Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{a.code}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: TEXT_S }}>{a.designation?.substring(0, 50)}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Type de mouvement</InputLabel>
              <Select value={form.typeMouvement} label="Type de mouvement" onChange={e => setForm({ ...form, typeMouvement: e.target.value })}>
                <MenuItem value="entree">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <TrendingUp sx={{ fontSize: 16, color: '#059669' }} /> Entrée
                  </Stack>
                </MenuItem>
                <MenuItem value="sortie">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} /> Sortie
                  </Stack>
                </MenuItem>
                <MenuItem value="ajustement">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Warning sx={{ fontSize: 16, color: ORANGE }} /> Ajustement
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Quantité" type="number" size="small" value={form.qte}
                onChange={e => setForm({ ...form, qte: e.target.value })} fullWidth required sx={fieldSx} />
              <TextField label="Référence document" size="small" value={form.referenceDocument || ''}
                onChange={e => setForm({ ...form, referenceDocument: e.target.value })} fullWidth sx={fieldSx} />
            </Stack>

            <TextField label="Observations" size="small" value={form.observations || ''}
              onChange={e => setForm({ ...form, observations: e.target.value })}
              fullWidth multiline rows={2} sx={fieldSx} />
          </Stack>
        </DialogContent>

        <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: `1px solid ${SURF2}`, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', color: TEXT_M, borderRadius: '8px', px: 2, fontFamily: 'Outfit', '&:hover': { bgcolor: SURF2 } }}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!form.articleId}
            sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', bgcolor: BLUE, color: 'white', borderRadius: '8px', px: 2.5, fontFamily: 'Outfit', boxShadow: `0 4px 12px ${BLUE}30`, '&:hover': { bgcolor: BLUE_D }, '&.Mui-disabled': { opacity: 0.45 } }}>
            Enregistrer
          </Button>
        </Box>
      </Dialog>

      {/* ══ DIALOG — Historique ═══════════════════════════════════════════════ */}
      <Dialog open={openHist} onClose={() => setOpenHist(false)} maxWidth="md" fullWidth fullScreen={isSmall}
        PaperProps={{ sx: { borderRadius: isSmall ? 0 : '14px', border: isSmall ? 'none' : `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, borderBottom: `1px solid ${SURF2}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD, fontFamily: 'Outfit' }}>Historique des mouvements</Typography>
            {selectedArticle && (
              <Typography sx={{ fontSize: '0.63rem', color: TEXT_S, fontFamily: 'Outfit' }}>
                {selectedArticle.code} — {selectedArticle.designation}
              </Typography>
            )}
          </Box>
          {isSmall && <IconButton onClick={() => setOpenHist(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>}
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {['Date', 'Type', 'Qté', 'Stock avant', 'Stock après', 'Référence'].map((h, i) => (
                  <TableCell key={i} sx={{
                    fontSize: '0.65rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.3,
                    px: i === 0 ? 2.5 : 2, fontFamily: 'Outfit',
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {histArticle.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography sx={{ fontSize: '0.76rem', color: TEXT_S, fontFamily: 'Outfit' }}>Aucun mouvement enregistré</Typography>
                  </TableCell>
                </TableRow>
              ) : histArticle.map((m, idx) => (
                <TableRow key={m.id} sx={{ '&:hover': { bgcolor: SURF3 }, borderBottom: idx === histArticle.length - 1 ? 'none' : `1px solid ${SURF2}` }}>
                  <TableCell sx={{ px: 2.5, py: 1.3, fontSize: '0.74rem', color: '#475569' }}>
                    {dayjs(m.dateMouvement).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell sx={{ py: 1.3 }}>
                    <Box sx={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px', ...mvtBadgeSx(m.typeMouvement) }}>
                      {m.typeMouvement}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.3, fontSize: '0.74rem', fontWeight: 700, color: BLUE_DD }}>{m.qte}</TableCell>
                  <TableCell sx={{ py: 1.3, fontSize: '0.74rem', color: TEXT_M }}>{m.stockAvant}</TableCell>
                  <TableCell sx={{ py: 1.3 }}>
                    <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: BLUE_D }}>{m.stockApres}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.3, fontSize: '0.72rem', color: TEXT_M, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.referenceDocument || <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: `1px solid ${SURF2}`, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setOpenHist(false)} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', color: TEXT_M, borderRadius: '8px', px: 2, fontFamily: 'Outfit', '&:hover': { bgcolor: SURF2 } }}>
            Fermer
          </Button>
        </Box>
      </Dialog>

    </Box>
  )
}