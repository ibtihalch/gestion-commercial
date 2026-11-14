import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, Pagination,
  Dialog, DialogContent, Stack, InputAdornment, TextField,
  MenuItem, Select, FormControl, InputLabel, useMediaQuery,
  useTheme, Card, CardContent, Grid, Divider, Collapse, Badge,
  Tooltip, Switch
} from '@mui/material'
import {
  Add, Edit, Delete, Inventory2Outlined, Warning,
  Search, FilterList, Close, Category, AccountTree, Clear,
  AddCircleOutline, FileDownload, PowerSettingsNew
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import articleService from '../../services/articleService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

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

const UNITES = ['U', 'Ens', 'Lot', 'Fft', 'ml', 'm²', 'm³', 'kg', 'Litre',
                'Heure', 'Jour', 'Mois', 'Jeu', 'Pce', 'Rlx', 'Bte', 'Paire',
                'Palette', 'km']

const EMPTY_FORM = {
  code: '', designation: '', unite: '', prixAchat: 0,
  prixVente: 0, stock: 0, seuilAlerte: 5, actif: true,
  familleId: '', sousFamilleId: '',
}

const EMPTY_FAMILLE = { libelle: '', description: '' }
const EMPTY_SOUSFAM = { libelle: '', description: '', familleId: '' }

const genCode = (libelle) => {
  if (!libelle) return ''
  return libelle
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 3))
    .join('-')
    .slice(0, 12)
}

const fmtMAD = (v) => Number(v || 0).toFixed(2)

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

const sx_input_error = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px', fontSize: '0.82rem',
    '& fieldset': { borderColor: '#ef4444' },
    '&:hover fieldset': { borderColor: '#ef4444' },
    '&.Mui-focused fieldset': { borderColor: '#ef4444', borderWidth: 1.5 },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.78rem', color: '#ef4444',
    '&.Mui-focused': { color: '#ef4444' },
  },
}

const Field = ({ label, value, onChange, error, helperText, ...props }) => (
  <TextField label={label} value={value} onChange={onChange}
    fullWidth size="small" error={error} helperText={helperText}
    {...props} sx={{ ...(error ? sx_input_error : sx_input), ...props.sx }} />
)

const SelectField = ({ label, value, onChange, children, error, helperText, ...props }) => (
  <FormControl fullWidth size="small" error={error} {...props}>
    <InputLabel sx={{ fontSize: '0.78rem', color: error ? '#ef4444' : TEXT_M, '&.Mui-focused': { color: error ? '#ef4444' : BLUE } }}>
      {label}
    </InputLabel>
    <Select value={value} onChange={onChange} label={label} sx={{
      borderRadius: '8px', fontSize: '0.82rem',
      '& .MuiOutlinedInput-notchedOutline': { borderColor: error ? '#ef4444' : BORDER },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: error ? '#ef4444' : BLUE + '60' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: error ? '#ef4444' : BLUE, borderWidth: 1.5 },
    }}>
      {children}
    </Select>
    {helperText && <Typography sx={{ fontSize: '0.65rem', color: '#ef4444', mt: 0.4, ml: 1.5 }}>{helperText}</Typography>}
  </FormControl>
)

const QuickAddBtn = ({ onClick, tooltip, disabled }) => (
  <Tooltip title={tooltip} placement="top">
    <span>
      <IconButton onClick={onClick} size="small" disabled={disabled} sx={{
        width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
        color: disabled ? TEXT_S : BLUE_D,
        bgcolor: disabled ? SURF2 : BG_PAGE,
        border: `1px solid ${disabled ? BORDER : BLUE + '30'}`,
        '&:hover': { bgcolor: disabled ? SURF2 : BLUE + '15' },
        transition: 'all .15s',
      }}>
        <AddCircleOutline sx={{ fontSize: 17 }} />
      </IconButton>
    </span>
  </Tooltip>
)

const SectionLabel = ({ children }) => (
  <Typography sx={{
    fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
    textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8,
    fontFamily: 'Outfit',
  }}>
    {children}
  </Typography>
)

const QuickDialog = ({ open, onClose, title, icon, children, onSave, saving }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
    <Box sx={{ px: 2.5, pt: 2.2, pb: 1.8, borderBottom: `1px solid ${SURF2}`, display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: BG_PAGE, border: `1px solid ${BLUE}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: BLUE_DD, flex: 1, fontFamily: 'Outfit' }}>{title}</Typography>
      <IconButton size="small" onClick={onClose}><Close sx={{ fontSize: 16 }} /></IconButton>
    </Box>
    <DialogContent sx={{ px: 2.5, py: 2 }}>
      <Stack spacing={1.5}>{children}</Stack>
    </DialogContent>
    <Box sx={{ px: 2.5, py: 1.8, borderTop: `1px solid ${SURF2}`, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Button onClick={onClose} sx={{ fontSize: '0.73rem', fontWeight: 600, textTransform: 'none', color: TEXT_M, borderRadius: '8px', px: 2, fontFamily: 'Outfit', '&:hover': { bgcolor: SURF2 } }}>
        Annuler
      </Button>
      <Button onClick={onSave} disabled={saving} sx={{
        fontSize: '0.73rem', fontWeight: 700, textTransform: 'none', fontFamily: 'Outfit',
        bgcolor: BLUE, color: 'white', borderRadius: '8px', px: 2.2,
        boxShadow: `0 4px 12px ${BLUE}30`,
        '&:hover': { bgcolor: BLUE_D },
        '&.Mui-disabled': { bgcolor: SURF2, color: TEXT_S },
      }}>
        {saving ? 'Création...' : 'Créer'}
      </Button>
    </Box>
  </Dialog>
)

const ArticleCard = ({ a, onEdit, onDelete, onToggle, isAdmin, alerte }) => (
  <Card sx={{
    border: `1px solid ${alerte ? ORANGE + '40' : BORDER}`,
    borderRadius: '12px', mb: 1.5,
    bgcolor: alerte ? '#FFFBEB' : 'white',
    opacity: a.actif ? 1 : 0.65,
    boxShadow: 'none', transition: 'box-shadow .15s',
    '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' }
  }}>
    <CardContent sx={{ p: '12px 14px !important' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1} mr={1}>
          <Stack direction="row" alignItems="center" gap={0.8} mb={0.5} flexWrap="wrap">
            {alerte && <Warning sx={{ fontSize: 13, color: ORANGE }} />}
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE, fontFamily: 'monospace' }}>
              {a.code}
            </Typography>
            {a.familleLibelle && (
              <Chip label={a.familleLibelle} size="small" sx={{ fontSize: '0.58rem', height: 16, borderRadius: '4px', bgcolor: BG_PAGE, color: BLUE_D, fontWeight: 600, border: `1px solid ${BLUE}20` }} />
            )}
            {a.sousFamilleLibelle && (
              <Chip label={a.sousFamilleLibelle} size="small" sx={{ fontSize: '0.58rem', height: 16, borderRadius: '4px', bgcolor: SURF2, color: BLUE_DD, fontWeight: 600, border: `1px solid ${BORDER}` }} />
            )}
          </Stack>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: BLUE_DD, mb: 0.6, lineHeight: 1.3, fontFamily: 'Outfit' }}>
            {a.designation}
          </Typography>
          <Stack direction="row" gap={0.8} flexWrap="wrap">
            {a.unite && (
              <Box sx={{ bgcolor: BG_PAGE, borderRadius: '5px', px: 0.8, py: 0.2, display: 'inline-flex', border: `1px solid ${BLUE}20` }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: BLUE_D, fontFamily: 'monospace' }}>{a.unite}</Typography>
              </Box>
            )}
            <Chip label={`Stock: ${a.stock}`} size="small" sx={{
              fontSize: '0.62rem', height: 18, borderRadius: '5px',
              bgcolor: alerte ? '#FEF3C7' : BG_PAGE,
              color: alerte ? '#92400E' : BLUE_D,
              border: `1px solid ${alerte ? ORANGE + '50' : BLUE + '20'}`,
            }} />
            <Chip label={a.actif ? 'Actif' : 'Inactif'} size="small" sx={{
              fontSize: '0.62rem', height: 18, borderRadius: '5px',
              bgcolor: a.actif ? BG_PAGE : SURF2,
              color: a.actif ? BLUE_D : TEXT_M,
              border: `1px solid ${a.actif ? BLUE + '20' : BORDER}`,
            }} />
          </Stack>
        </Box>
        <Stack direction="row" gap={0.5} flexShrink={0}>
          {/* Toggle — tout le monde */}
          <Tooltip title={a.actif ? 'Désactiver' : 'Activer'}>
            <IconButton size="small" onClick={() => onToggle(a)} sx={{
              width: 30, height: 30, borderRadius: '7px',
              color: a.actif ? '#16A34A' : TEXT_S,
              bgcolor: a.actif ? '#f0fdf4' : SURF2,
              '&:hover': { bgcolor: a.actif ? '#dcfce7' : '#e2e8f0' },
            }}>
              <PowerSettingsNew sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => onEdit(a)} sx={{ width: 30, height: 30, borderRadius: '7px', color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' } }}>
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>
          {isAdmin && (
            <IconButton size="small" onClick={() => onDelete(a.id)} sx={{ width: 30, height: 30, borderRadius: '7px', color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>
      </Stack>
      <Divider sx={{ my: 1, borderColor: SURF2 }} />
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, mb: 0.2 }}>Prix achat</Typography>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: TEXT_M }}>{fmtMAD(a.prixAchat)} MAD</Typography>
        </Box>
        <Box textAlign="right">
          <Typography sx={{ fontSize: '0.6rem', color: TEXT_S, mb: 0.2 }}>Prix vente</Typography>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: BLUE_D }}>{fmtMAD(a.prixVente)} MAD</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
)

export default function ArticlesPage() {
  const { user } = useAuth()
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall  = useMediaQuery(theme.breakpoints.down('sm'))
  const isAdmin  = user?.role === 'ROLE_ADMIN' ||
                   user?.roles?.includes('ROLE_ADMIN') ||
                   user?.authorities?.some(a => a.authority === 'ROLE_ADMIN') ||
                   user?.login === 'admin'

  const [articles,    setArticles]    = useState([])
  const [alertes,     setAlertes]     = useState([])
  const [familles,    setFamilles]    = useState([])
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [actifOnly,   setActifOnly]   = useState(false)

  const [open,        setOpen]        = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [errors,      setErrors]      = useState({})
  const [formSousFam, setFormSousFam] = useState([])
  const [uniteCustom, setUniteCustom] = useState(false)

  const [filtersOpen,     setFiltersOpen]     = useState(!isMobile)
  const [filters,         setFilters]         = useState({ search: '', familleId: '', sousFamilleId: '' })
  const [filterSousFam,   setFilterSousFam]   = useState([])
  const [allSousFamilles, setAllSousFamilles] = useState([])
  const [exporting,       setExporting]       = useState(false)

  const [qfOpen,   setQfOpen]   = useState(false)
  const [qfForm,   setQfForm]   = useState(EMPTY_FAMILLE)
  const [qfSaving, setQfSaving] = useState(false)
  const [qsfOpen,   setQsfOpen]   = useState(false)
  const [qsfForm,   setQsfForm]   = useState(EMPTY_SOUSFAM)
  const [qsfSaving, setQsfSaving] = useState(false)

  const activeFilterCount = [filters.search, filters.familleId, filters.sousFamilleId, actifOnly || ''].filter(Boolean).length

  const loadFamilles = useCallback(() => {
    articleService.getAllFamilles({ size: 200, entrepriseId: user?.entrepriseId })
      .then(data => setFamilles(data.content || data || []))
      .catch(() => {})
  }, [user?.entrepriseId])

  useEffect(() => { loadFamilles() }, [loadFamilles])

  const loadAllSousFamilles = useCallback(() => {
    articleService.getAllSousFamilles({ size: 500, entrepriseId: user?.entrepriseId })
      .then(data => {
        const list = data.content || data || []
        setAllSousFamilles(list)
        setFilterSousFam(list)
      })
      .catch(() => {})
  }, [user?.entrepriseId])

  useEffect(() => { loadAllSousFamilles() }, [loadAllSousFamilles])

  useEffect(() => {
    if (filters.familleId) {
      setFilterSousFam(allSousFamilles.filter(sf => sf.familleId === filters.familleId || String(sf.familleId) === String(filters.familleId)))
      setFilters(f => {
        if (f.sousFamilleId && !allSousFamilles.find(sf => sf.id === f.sousFamilleId && (sf.familleId === f.familleId || String(sf.familleId) === String(f.familleId)))) {
          return { ...f, sousFamilleId: '' }
        }
        return f
      })
    } else {
      setFilterSousFam(allSousFamilles)
    }
  }, [filters.familleId, allSousFamilles])

  useEffect(() => {
    if (form.familleId) {
      articleService.getSousFamillesByFamille(form.familleId)
        .then(setFormSousFam).catch(() => setFormSousFam([]))
    } else {
      setFormSousFam([])
      setForm(f => ({ ...f, sousFamilleId: '' }))
    }
  }, [form.familleId])

  const load = useCallback(() => {
    const params = {
      page: page - 1, size: 10, entrepriseId: user?.entrepriseId,
      ...(filters.search        && { search:        filters.search }),
      ...(filters.familleId     && { familleId:     filters.familleId }),
      ...(filters.sousFamilleId && { sousFamilleId: filters.sousFamilleId }),
      ...(actifOnly             && { actifOnly:     true }),
    }
    articleService.getAll(params)
      .then(data => { setArticles(data.content || []); setTotalPages(data.totalPages || 1) })
    articleService.getAlertes().then(setAlertes).catch(() => {})
  }, [page, filters, actifOnly, user?.entrepriseId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filters, actifOnly])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setErrors({})
    setUniteCustom(false); setOpen(true)
  }
  const openEdit = (a) => {
    setEditing(a)
    const isPredef = UNITES.includes(a.unite)
    setUniteCustom(!!a.unite && !isPredef)
    setForm({ ...a, familleId: a.familleId || '', sousFamilleId: a.sousFamilleId || '' })
    setErrors({})
    setOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.designation?.trim()) e.designation = 'La désignation est obligatoire'
    if (!form.unite?.trim())       e.unite       = "L'unité est obligatoire"
    if (!form.familleId)           e.familleId   = 'La famille est obligatoire'
    if (!form.sousFamilleId)       e.sousFamilleId = 'La sous-famille est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      const payload = { ...form, entrepriseId: user?.entrepriseId, familleId: form.familleId || null, sousFamilleId: form.sousFamilleId || null }
      if (editing) await articleService.update(editing.id, payload)
      else         await articleService.create(payload)
      toast.success(editing ? 'Article modifié' : 'Article créé')
      setOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet article ?')) return
    try { await articleService.delete(id); toast.success('Article supprimé'); load() }
    catch { toast.error('Erreur suppression') }
  }

  const handleToggle = async (a) => {
    try {
      await articleService.toggleActif(a.id)
      toast.success(`Article ${a.actif ? 'désactivé' : 'activé'}`)
      load()
    } catch { toast.error('Erreur lors du changement de statut') }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await articleService.getAll({
        page: 0, size: 9999, entrepriseId: user?.entrepriseId,
        ...(filters.search        && { search:        filters.search }),
        ...(filters.familleId     && { familleId:     filters.familleId }),
        ...(filters.sousFamilleId && { sousFamilleId: filters.sousFamilleId }),
        ...(actifOnly             && { actifOnly:     true }),
      })
      const all = data.content || []
      if (all.length === 0) { toast.error('Aucun article à exporter'); return }
      const excelData = all.map(a => ({
        'Code': a.code || '', 'Désignation': a.designation || '',
        'Famille': a.familleLibelle || '', 'Sous-famille': a.sousFamilleLibelle || '',
        'Unité': a.unite || '', 'Prix achat': fmtMAD(a.prixAchat),
        'Prix vente': fmtMAD(a.prixVente), 'Stock': a.stock ?? 0,
        'Seuil alerte': a.seuilAlerte ?? 0, 'Statut': a.actif ? 'Actif' : 'Inactif',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      ws['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Articles')
      XLSX.writeFile(wb, `Articles_${dayjs().format('YYYYMMDD')}.xlsx`)
      toast.success(`${all.length} article(s) exporté(s)`)
    } catch { toast.error("Erreur lors de l'export") }
    finally  { setExporting(false) }
  }

  const handleCreateFamille = async () => {
    if (!qfForm.libelle) return toast.error('Le libellé est requis')
    setQfSaving(true)
    try {
      const code = qfForm.code || genCode(qfForm.libelle)
      const created = await articleService.createFamille({ ...qfForm, code, entrepriseId: user?.entrepriseId })
      toast.success(`Famille "${created.libelle}" créée`)
      await loadFamilles()
      setForm(f => ({ ...f, familleId: created.id, sousFamilleId: '' }))
      setErrors(e => ({ ...e, familleId: undefined }))
      setQfOpen(false); setQfForm(EMPTY_FAMILLE)
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur création famille') }
    finally { setQfSaving(false) }
  }

  const handleCreateSousFamille = async () => {
    if (!qsfForm.libelle) return toast.error('Le libellé est requis')
    if (!form.familleId) return toast.error("Sélectionnez d'abord une famille")
    setQsfSaving(true)
    try {
      const code = qsfForm.code || genCode(qsfForm.libelle)
      const created = await articleService.createSousFamille({ ...qsfForm, code, familleId: form.familleId })
      toast.success(`Sous-famille "${created.libelle}" créée`)
      const updated = await articleService.getSousFamillesByFamille(form.familleId)
      setFormSousFam(updated)
      setForm(f => ({ ...f, sousFamilleId: created.id }))
      setErrors(e => ({ ...e, sousFamilleId: undefined }))
      setQsfOpen(false); setQsfForm(EMPTY_SOUSFAM)
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur création sous-famille') }
    finally { setQsfSaving(false) }
  }

  const resetFilters = () => { setFilters({ search: '', familleId: '', sousFamilleId: '' }); setActifOnly(false) }
  const isAlerte = (a) => Number(a.stock) <= Number(a.seuilAlerte)

  const FiltersBar = () => (
    <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            placeholder="Rechercher par code ou désignation..."
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
            fullWidth size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: TEXT_S }} /></InputAdornment>,
              endAdornment: filters.search
                ? <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setFilters(f => ({ ...f, search: '' }))}><Clear sx={{ fontSize: 14 }} /></IconButton>
                  </InputAdornment> : null,
            }}
            sx={sx_input}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SelectField label="Famille" value={filters.familleId}
            onChange={e => { setFilters(f => ({ ...f, familleId: e.target.value, sousFamilleId: '' })); setPage(1) }}>
            <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Toutes</em></MenuItem>
            {familles.map(f => <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.8rem' }}>{f.libelle}</MenuItem>)}
          </SelectField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SelectField label="Sous-famille" value={filters.sousFamilleId}
            onChange={e => { setFilters(f => ({ ...f, sousFamilleId: e.target.value })); setPage(1) }}>
            <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Toutes</em></MenuItem>
            {filterSousFam.map(sf => <MenuItem key={sf.id} value={sf.id} sx={{ fontSize: '0.8rem' }}>{sf.libelle}</MenuItem>)}
          </SelectField>
        </Grid>
        <Grid item xs={12} sm="auto">
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.8,
            bgcolor: 'white', border: `1px solid ${actifOnly ? BLUE + '40' : BORDER}`,
            borderRadius: '8px', px: 1.5, py: 0.55, transition: 'border-color .2s',
          }}>
            <Switch size="small" checked={actifOnly} onChange={e => setActifOnly(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: BLUE },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BLUE },
              }}
            />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: actifOnly ? BLUE_D : TEXT_M, fontFamily: 'Outfit', whiteSpace: 'nowrap' }}>
              Actifs seulement
            </Typography>
          </Box>
        </Grid>
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
  )

  return (
    <Box>
      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Inventory2Outlined sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>Articles</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>Catalogue et gestion du stock</Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1}>
          {isMobile && (
            <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <IconButton onClick={() => setFiltersOpen(v => !v)} sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: filtersOpen ? BG_PAGE : 'white', border: `1px solid ${BORDER}`, color: filtersOpen ? BLUE : TEXT_M }}>
                <FilterList sx={{ fontSize: 18 }} />
              </IconButton>
            </Badge>
          )}
          <Tooltip title="Exporter en Excel">
            <Button onClick={handleExport} disabled={exporting}
              startIcon={!isSmall && <FileDownload sx={{ fontSize: '15px !important' }} />}
              sx={{
                bgcolor: '#f0fdf4', color: '#16A34A', border: '1px solid #bbf7d0', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                px: { xs: 1.2, md: 1.8 }, py: 0.8, fontFamily: 'Outfit',
                minWidth: isSmall ? 36 : 'auto',
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' },
                '&.Mui-disabled': { opacity: 0.6 },
              }}>
              {isSmall ? <FileDownload sx={{ fontSize: 18 }} /> : exporting ? 'Export…' : 'Excel'}
            </Button>
          </Tooltip>
          <Button onClick={openCreate}
            startIcon={!isSmall && <Add sx={{ fontSize: '16px !important' }} />}
            sx={{
              bgcolor: BLUE, color: 'white', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              px: { xs: 1.5, md: 2 }, py: 0.8, fontFamily: 'Outfit',
              minWidth: isSmall ? 36 : 'auto',
              boxShadow: `0 4px 12px ${BLUE}30`,
              '&:hover': { bgcolor: BLUE_D },
            }}>
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouvel article'}
          </Button>
        </Stack>
      </Stack>

      {/* ALERTE STOCK */}
      {alertes.length > 0 && (
        <Box sx={{
          bgcolor: '#FFFBEB', border: `1px solid ${ORANGE}40`, borderRadius: 2,
          px: { xs: 1.5, md: 2 }, py: 1.2, mb: 2,
          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
        }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: '#FEF3C7', border: `1px solid ${ORANGE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Warning sx={{ fontSize: 15, color: ORANGE }} />
          </Box>
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#92400E', flex: 1, fontFamily: 'Outfit' }}>
            {alertes.length} article{alertes.length > 1 ? 's' : ''} sous le seuil d'alerte stock
          </Typography>
          <Box sx={{ bgcolor: ORANGE + '18', borderRadius: '6px', px: 1, py: 0.3 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400E', fontFamily: 'Outfit' }}>Réapprovisionnement requis</Typography>
          </Box>
        </Box>
      )}

      {/* FILTRES */}
      {isMobile ? <Collapse in={filtersOpen}><FiltersBar /></Collapse> : <FiltersBar />}

      {/* TABLE / CARDS */}
      {isMobile ? (
        <Box>
          {articles.map(a => (
            <ArticleCard key={a.id} a={a} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} isAdmin={isAdmin} alerte={isAlerte(a)} />
          ))}
          {articles.length === 0 && (
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
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {['Code', 'Désignation', 'Famille', 'Sous-famille', 'Unité', 'Prix achat', 'Prix vente', 'Stock', 'Statut', ''].map((h, i) => (
                  <TableCell key={i} align={[5,6,7].includes(i) ? 'right' : 'left'} sx={{
                    fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.5,
                    px: i === 0 ? 2.5 : 1.5, whiteSpace: 'nowrap', fontFamily: 'Outfit',
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((a, idx) => {
                const alerte = isAlerte(a)
                return (
                  <TableRow key={a.id} sx={{
                    opacity: a.actif ? 1 : 0.6,
                    bgcolor: alerte ? '#FFFBEB' : 'white',
                    '&:hover': { bgcolor: alerte ? '#FEF3C7' : SURF3 },
                    borderBottom: idx === articles.length - 1 ? 'none' : `1px solid ${SURF2}`,
                    transition: 'background .1s',
                  }}>
                    <TableCell sx={{ px: 2.5, py: 1.4 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'monospace' }}>{a.code}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.4, maxWidth: 150 }}>
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        {alerte && <Warning sx={{ fontSize: 13, color: ORANGE, flexShrink: 0 }} />}
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: alerte ? '#92400E' : BLUE_DD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit' }}>
                          {a.designation}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>
                      {a.familleLibelle
                        ? <Chip label={a.familleLibelle} size="small" icon={<Category sx={{ fontSize: '10px !important' }} />}
                            sx={{ fontSize: '0.64rem', fontWeight: 600, height: 20, borderRadius: '5px', bgcolor: BG_PAGE, color: BLUE_D, border: `1px solid ${BLUE}20`, '& .MuiChip-icon': { color: BLUE_D } }} />
                        : <span style={{ color: '#c7d4e8', fontSize: '0.72rem' }}>—</span>}
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>
                      {a.sousFamilleLibelle
                        ? <Chip label={a.sousFamilleLibelle} size="small" icon={<AccountTree sx={{ fontSize: '10px !important' }} />}
                            sx={{ fontSize: '0.64rem', fontWeight: 600, height: 20, borderRadius: '5px', bgcolor: SURF2, color: BLUE_DD, border: `1px solid ${BORDER}`, '& .MuiChip-icon': { color: BLUE_DD } }} />
                        : <span style={{ color: '#c7d4e8', fontSize: '0.72rem' }}>—</span>}
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>
                      {a.unite
                        ? <Box sx={{ display: 'inline-block', bgcolor: BG_PAGE, borderRadius: '5px', px: 1, py: 0.2, border: `1px solid ${BLUE}20` }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BLUE_D, fontFamily: 'monospace' }}>{a.unite}</Typography>
                          </Box>
                        : <span style={{ color: '#c7d4e8' }}>—</span>}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4 }}>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: TEXT_M, fontFamily: 'Outfit' }}>{fmtMAD(a.prixAchat)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4 }}>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: BLUE_D, fontFamily: 'Outfit' }}>{fmtMAD(a.prixVente)}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4 }}>
                      <Chip label={a.stock} size="small" sx={{
                        fontSize: '0.68rem', fontWeight: 700, height: 22, borderRadius: '6px', minWidth: 36,
                        bgcolor: alerte ? '#FEF3C7' : BG_PAGE,
                        color: alerte ? '#92400E' : BLUE_D,
                        border: `1px solid ${alerte ? ORANGE + '50' : BLUE + '20'}`,
                      }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.4 }}>
                      <Chip label={a.actif ? 'Actif' : 'Inactif'} size="small" sx={{
                        fontSize: '0.65rem', fontWeight: 700, height: 22, borderRadius: '6px',
                        bgcolor: a.actif ? BG_PAGE : SURF2,
                        color: a.actif ? BLUE_D : TEXT_M,
                        border: `1px solid ${a.actif ? BLUE + '20' : BORDER}`,
                      }} />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                      <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                        {/* Toggle — tout le monde */}
                        <Tooltip title={a.actif ? 'Désactiver' : 'Activer'}>
                          <IconButton size="small" onClick={() => handleToggle(a)} sx={{
                            width: 28, height: 28, borderRadius: '6px',
                            color: a.actif ? '#16A34A' : TEXT_S,
                            bgcolor: a.actif ? '#f0fdf4' : SURF2,
                            '&:hover': { bgcolor: a.actif ? '#dcfce7' : '#e2e8f0' },
                          }}>
                            <PowerSettingsNew sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => openEdit(a)} sx={{ width: 28, height: 28, borderRadius: '6px', color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' } }}>
                          <Edit sx={{ fontSize: 14 }} />
                        </IconButton>
                        {isAdmin && (
                          <IconButton size="small" onClick={() => handleDelete(a.id)} sx={{ width: 28, height: 28, borderRadius: '6px', color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                            <Delete sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
              {articles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Inventory2Outlined sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucun article trouvé</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {activeFilterCount > 0 ? 'Aucun résultat pour ces filtres' : 'Ajoutez votre premier article au catalogue'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Box display="flex" justifyContent="center" mt={2.5}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" sx={{
          '& .MuiPaginationItem-root': { fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px', color: TEXT_M, fontFamily: 'Outfit', '&:hover': { bgcolor: BG_PAGE, color: BLUE } },
          '& .Mui-selected': { bgcolor: `${BLUE} !important`, color: 'white !important' },
        }} />
      </Box>

      {/* DIALOG ARTICLE */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isSmall}
        PaperProps={{ sx: { borderRadius: isSmall ? 0 : '14px', border: isSmall ? 'none' : `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>

        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, borderBottom: `1px solid ${SURF2}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2Outlined sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD, fontFamily: 'Outfit' }}>
              {editing ? "Modifier l'article" : 'Nouvel article'}
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: TEXT_S, fontFamily: 'Outfit' }}>
              {editing ? `Édition de ${editing.designation || editing.code}` : 'Remplissez les informations'}
            </Typography>
          </Box>
          {isSmall && <IconButton onClick={() => setOpen(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>}
        </Box>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
          <Stack spacing={2}>

            <Box>
              <SectionLabel>Identification</SectionLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Field label="Code *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} sx={{ maxWidth: { sm: 140 } }} />
                <Box flex={1}>
                  {!uniteCustom ? (
                    <SelectField
                      label="Unité *" value={form.unite}
                      error={!!errors.unite} helperText={errors.unite}
                      onChange={e => {
                        if (e.target.value === '__autre__') { setUniteCustom(true); setForm({ ...form, unite: '' }) }
                        else { setForm({ ...form, unite: e.target.value }); setErrors(er => ({ ...er, unite: undefined })) }
                      }}>
                      <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Aucune</em></MenuItem>
                      {UNITES.map(u => <MenuItem key={u} value={u} sx={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{u}</MenuItem>)}
                      <Divider />
                      <MenuItem value="__autre__" sx={{ fontSize: '0.78rem', color: BLUE, fontWeight: 600 }}>Saisir manuellement...</MenuItem>
                    </SelectField>
                  ) : (
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Field
                        label="Unité * (saisie libre)" value={form.unite}
                        error={!!errors.unite} helperText={errors.unite}
                        onChange={e => { setForm({ ...form, unite: e.target.value }); setErrors(er => ({ ...er, unite: undefined })) }}
                        sx={{ flex: 1 }}
                      />
                      <Tooltip title="Revenir à la liste">
                        <IconButton size="small" onClick={() => { setUniteCustom(false); setForm({ ...form, unite: '' }) }}
                          sx={{ width: 34, height: 34, borderRadius: '8px', color: TEXT_M, bgcolor: SURF2, '&:hover': { bgcolor: BORDER } }}>
                          <Close sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>

            <Field
              label="Désignation *" value={form.designation}
              error={!!errors.designation} helperText={errors.designation}
              onChange={e => { setForm({ ...form, designation: e.target.value }); setErrors(er => ({ ...er, designation: undefined })) }}
              multiline rows={2}
            />

            <Box>
              <SectionLabel>Classification *</SectionLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Stack direction="row" spacing={0.8} alignItems="flex-start" flex={1}>
                  <Box flex={1}>
                    <SelectField
                      label="Famille *" value={form.familleId}
                      error={!!errors.familleId} helperText={errors.familleId}
                      onChange={e => { setForm({ ...form, familleId: e.target.value, sousFamilleId: '' }); setErrors(er => ({ ...er, familleId: undefined })) }}>
                      <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Aucune</em></MenuItem>
                      {familles.map(f => <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.8rem' }}>{f.libelle}</MenuItem>)}
                    </SelectField>
                  </Box>
                  <QuickAddBtn tooltip="Créer une nouvelle famille" onClick={() => { setQfForm(EMPTY_FAMILLE); setQfOpen(true) }} />
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="flex-start" flex={1}>
                  <Box flex={1}>
                    <SelectField
                      label="Sous-famille *" value={form.sousFamilleId}
                      error={!!errors.sousFamilleId} helperText={errors.sousFamilleId}
                      disabled={!form.familleId}
                      onChange={e => { setForm({ ...form, sousFamilleId: e.target.value }); setErrors(er => ({ ...er, sousFamilleId: undefined })) }}>
                      <MenuItem value=""><em style={{ fontSize: '0.78rem', color: TEXT_S }}>Aucune</em></MenuItem>
                      {formSousFam.map(sf => <MenuItem key={sf.id} value={sf.id} sx={{ fontSize: '0.8rem' }}>{sf.libelle}</MenuItem>)}
                    </SelectField>
                  </Box>
                  <QuickAddBtn
                    tooltip={form.familleId ? 'Créer une nouvelle sous-famille' : "Sélectionnez d'abord une famille"}
                    disabled={!form.familleId}
                    onClick={() => { setQsfForm({ ...EMPTY_SOUSFAM, familleId: form.familleId }); setQsfOpen(true) }}
                  />
                </Stack>
              </Stack>
            </Box>

            <Box>
              <SectionLabel>Tarification</SectionLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Field label="Prix achat (MAD)" type="number" value={form.prixAchat} onChange={e => setForm({ ...form, prixAchat: e.target.value })} />
                <Field label="Prix vente (MAD)" type="number" value={form.prixVente} onChange={e => setForm({ ...form, prixVente: e.target.value })} />
              </Stack>
            </Box>

            <Box>
              <SectionLabel>Stock</SectionLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Field label="Quantité en stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                <Field label="Seuil d'alerte" type="number" value={form.seuilAlerte} onChange={e => setForm({ ...form, seuilAlerte: e.target.value })} />
              </Stack>
            </Box>

          </Stack>
        </DialogContent>

        <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: `1px solid ${SURF2}`, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', color: TEXT_M, borderRadius: '8px', px: 2, fontFamily: 'Outfit', '&:hover': { bgcolor: SURF2 } }}>
            Annuler
          </Button>
          <Button onClick={handleSave} sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', bgcolor: BLUE, color: 'white', borderRadius: '8px', px: 2.5, fontFamily: 'Outfit', boxShadow: `0 4px 12px ${BLUE}30`, '&:hover': { bgcolor: BLUE_D } }}>
            Enregistrer
          </Button>
        </Box>
      </Dialog>

      {/* QUICK-ADD FAMILLE */}
      <QuickDialog open={qfOpen} onClose={() => setQfOpen(false)} title="Nouvelle famille"
        icon={<Category sx={{ fontSize: 15, color: BLUE }} />}
        onSave={handleCreateFamille} saving={qfSaving}>
        <Field label="Libellé *" value={qfForm.libelle} onChange={e => setQfForm({ ...qfForm, libelle: e.target.value })} />
        <Field label="Description" value={qfForm.description} onChange={e => setQfForm({ ...qfForm, description: e.target.value })} multiline rows={2} />
        <Box sx={{ bgcolor: BG_PAGE, border: `1px solid ${BLUE}20`, borderRadius: '8px', px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', color: BLUE_D, fontFamily: 'Outfit' }}>
            La famille sera immédiatement sélectionnée dans le formulaire article.
          </Typography>
        </Box>
      </QuickDialog>

      {/* QUICK-ADD SOUS-FAMILLE */}
      <QuickDialog open={qsfOpen} onClose={() => setQsfOpen(false)} title="Nouvelle sous-famille"
        icon={<AccountTree sx={{ fontSize: 15, color: BLUE }} />}
        onSave={handleCreateSousFamille} saving={qsfSaving}>
        <Box sx={{ bgcolor: BG_PAGE, borderRadius: '8px', px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 1, border: `1px solid ${BLUE}20` }}>
          <Category sx={{ fontSize: 14, color: BLUE_D }} />
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'Outfit' }}>
            {familles.find(f => f.id === form.familleId)?.libelle || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: TEXT_S, ml: 0.5, fontFamily: 'Outfit' }}>(famille parente)</Typography>
        </Box>
        <Field label="Libellé *" value={qsfForm.libelle} onChange={e => setQsfForm({ ...qsfForm, libelle: e.target.value })} />
        <Field label="Description" value={qsfForm.description} onChange={e => setQsfForm({ ...qsfForm, description: e.target.value })} multiline rows={2} />
        <Box sx={{ bgcolor: BG_PAGE, border: `1px solid ${BLUE}20`, borderRadius: '8px', px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', color: BLUE_D, fontFamily: 'Outfit' }}>
            La sous-famille sera immédiatement sélectionnée dans le formulaire article.
          </Typography>
        </Box>
      </QuickDialog>
    </Box>
  )
}