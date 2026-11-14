import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, Pagination,
  Dialog, DialogContent, Stack, TextField, InputAdornment,
  useMediaQuery, useTheme, Card, CardContent, Divider, Tooltip, Switch
} from '@mui/material'
import { Add, Edit, Delete, WorkOutline, FileDownload, Search, Clear, Close, PowerSettingsNew } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import affaireService from '../../services/affaireService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const BG_PAGE = '#EEF2FB'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURF2   = '#f1f5f9'
const SURF3   = '#fafbfe'

const EMPTY = { nom: '', description: '', actif: true }

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

const Field = ({ label, value, onChange, error, helperText, ...props }) => (
  <TextField label={label} value={value} onChange={onChange}
    fullWidth size="small" error={error} helperText={helperText}
    {...props} sx={{ ...sx_input, ...props.sx }} />
)

const tagColor = (nom) => {
  const colors = [BLUE, BLUE_D, '#7C3AED', '#0891B2', '#059669', '#D97706']
  let hash = 0
  for (const c of (nom || '')) hash += c.charCodeAt(0)
  return colors[hash % colors.length]
}

const initials = (nom) => nom?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const Avatar = ({ nom, size = 32 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    bgcolor: tagColor(nom) + '18',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ fontSize: size < 36 ? '0.6rem' : '0.72rem', fontWeight: 800, color: tagColor(nom) }}>
      {initials(nom)}
    </Typography>
  </Box>
)

const AffaireCard = ({ r, onEdit, onDelete, onToggle, isAdmin }) => (
  <Card sx={{
    border: `1px solid ${BORDER}`, borderRadius: '12px', mb: 1.5,
    boxShadow: 'none', transition: 'box-shadow .15s',
    opacity: r.actif ? 1 : 0.65,
    '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
  }}>
    <CardContent sx={{ p: '12px 14px !important' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" gap={1.2} flex={1} mr={1}>
          <Avatar nom={r.nom} size={36} />
          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" gap={0.8} mb={0.3} flexWrap="wrap">
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                {r.nom}
              </Typography>
              <Chip label={r.actif ? 'Active' : 'Inactive'} size="small" sx={{
                fontSize: '0.58rem', fontWeight: 700, height: 18, borderRadius: '5px',
                bgcolor: r.actif ? '#dcfce7' : SURF2,
                color:   r.actif ? '#166534' : TEXT_M,
                border:  `1px solid ${r.actif ? '#bbf7d0' : BORDER}`,
              }} />
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" gap={0.5} flexShrink={0}>
          {/* Toggle — tout le monde */}
          <Tooltip title={r.actif ? 'Désactiver' : 'Activer'}>
            <IconButton size="small" onClick={() => onToggle(r)} sx={{
              width: 30, height: 30, borderRadius: '7px',
              color: r.actif ? '#16A34A' : TEXT_S,
              bgcolor: r.actif ? '#f0fdf4' : SURF2,
              '&:hover': { bgcolor: r.actif ? '#dcfce7' : '#e2e8f0' },
            }}>
              <PowerSettingsNew sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          {/* Modifier — tout le monde */}
          <IconButton size="small" onClick={() => onEdit(r)} sx={{
            width: 30, height: 30, borderRadius: '7px',
            color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' },
          }}>
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>

          {/* Supprimer — admin seulement */}
          {isAdmin && (
            <IconButton size="small" onClick={() => onDelete(r.id)} sx={{
              width: 30, height: 30, borderRadius: '7px',
              color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' },
            }}>
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {r.description && (
        <>
          <Divider sx={{ my: 1, borderColor: SURF2 }} />
          <Typography sx={{ fontSize: '0.72rem', color: TEXT_M, lineHeight: 1.5 }}>
            {r.description}
          </Typography>
        </>
      )}
    </CardContent>
  </Card>
)

export default function AffairesPage() {
  const { user }  = useAuth()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall   = useMediaQuery(theme.breakpoints.down('sm'))
  const isAdmin   = user?.role === 'ROLE_ADMIN' ||
                    user?.roles?.includes('ROLE_ADMIN') ||
                    user?.authorities?.some(a => a.authority === 'ROLE_ADMIN') ||
                    user?.login === 'admin'

  const [rows,       setRows]       = useState([])
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search,     setSearch]     = useState('')
  const [actifOnly,  setActifOnly]  = useState(false)
  const [open,       setOpen]       = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [errors,     setErrors]     = useState({})
  const [exporting,  setExporting]  = useState(false)

  const load = useCallback(() => {
    affaireService.getAll({
      page: page - 1, size: 10,
      entrepriseId: user?.entrepriseId,
      ...(search.trim() && { search: search.trim() }),
      ...(actifOnly     && { actifOnly: true }),
    })
      .then(d => { setRows(d.content || []); setTotalPages(d.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
  }, [page, search, actifOnly, user?.entrepriseId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, actifOnly])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true) }
  const openEdit   = (r) => { setEditing(r); setForm({ ...r }); setErrors({}); setOpen(true) }

  const validate = () => {
    const e = {}
    if (!form.nom?.trim()) e.nom = 'Le nom est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      const payload = { ...form, entrepriseId: user?.entrepriseId }
      if (editing) await affaireService.update(editing.id, payload)
      else         await affaireService.create(payload)
      toast.success(editing ? 'Affaire modifiée' : 'Affaire créée')
      setOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette affaire ?')) return
    try { await affaireService.delete(id); toast.success('Affaire supprimée'); load() }
    catch { toast.error('Erreur suppression') }
  }

  const handleToggle = async (r) => {
    try {
      await affaireService.toggleActif(r.id)
      toast.success(`Affaire ${r.actif ? 'désactivée' : 'activée'}`)
      load()
    } catch { toast.error('Erreur lors du changement de statut') }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await affaireService.getAll({
        page: 0, size: 9999, entrepriseId: user?.entrepriseId,
        ...(search.trim() && { search: search.trim() }),
        ...(actifOnly     && { actifOnly: true }),
      })
      const all = data.content || []
      if (all.length === 0) { toast.error('Aucune affaire à exporter'); return }
      const ws = XLSX.utils.json_to_sheet(all.map(r => ({
        'Nom': r.nom || '', 'Description': r.description || '',
        'Statut': r.actif ? 'Active' : 'Inactive',
      })))
      ws['!cols'] = [{ wch: 28 }, { wch: 48 }, { wch: 10 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Affaires')
      XLSX.writeFile(wb, `Affaires_${dayjs().format('YYYYMMDD')}.xlsx`)
      toast.success(`${all.length} affaire(s) exportée(s)`)
    } catch { toast.error("Erreur lors de l'export") }
    finally  { setExporting(false) }
  }

  return (
    <Box>
      <Box sx={{ height: 3, borderRadius: 2, mb: 2, background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)' }} />

      {/* HEADER */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}
        sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, px: { xs: 1.5, md: 2.5 }, py: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <WorkOutline sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Affaires
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              Liste et gestion des affaires
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1}>
          <Tooltip title="Exporter en Excel">
            <Button onClick={handleExport} disabled={exporting}
              startIcon={!isSmall && <FileDownload sx={{ fontSize: '15px !important' }} />}
              sx={{
                bgcolor: '#f0fdf4', color: '#16A34A', border: '1px solid #bbf7d0',
                borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'none', px: { xs: 1.2, md: 1.8 }, py: 0.8,
                fontFamily: 'Outfit', minWidth: isSmall ? 36 : 'auto',
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
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouvelle affaire'}
          </Button>
        </Stack>
      </Stack>

      {/* FILTRES */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} mb={2} alignItems={{ sm: 'center' }}>
        <TextField
          size="small" placeholder="Rechercher une affaire..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: TEXT_S }} /></InputAdornment>,
            endAdornment: search
              ? <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><Clear sx={{ fontSize: 14 }} /></IconButton>
                </InputAdornment>
              : null,
          }}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', fontSize: '0.78rem', bgcolor: 'white',
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: BLUE + '50' },
              '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
            },
            '& input::placeholder': { color: TEXT_S, fontSize: '0.78rem' },
          }}
        />

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
            Actives seulement
          </Typography>
        </Box>
      </Stack>

      {/* TABLE (desktop) / CARDS (mobile) */}
      {isMobile ? (
        <Box>
          {rows.map(r => (
            <AffaireCard key={r.id} r={r} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} isAdmin={isAdmin} />
          ))}
          {rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <WorkOutline sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucune affaire trouvée</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {search ? 'Modifiez votre recherche' : actifOnly ? 'Aucune affaire active' : 'Créez votre première affaire'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {['Affaire', 'Description', 'Statut', ''].map((h, i) => (
                  <TableCell key={i} align={i === 3 ? 'right' : 'left'} sx={{
                    fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.5,
                    px: i === 0 ? 2.5 : 2, fontFamily: 'Outfit',
                    width: i === 1 ? '45%' : 'auto',
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.id} sx={{
                  opacity: r.actif ? 1 : 0.6,
                  '&:hover': { bgcolor: SURF3 },
                  borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${SURF2}`,
                  transition: 'background .1s',
                }}>
                  <TableCell sx={{ px: 2.5, py: 1.4 }}>
                    <Stack direction="row" alignItems="center" gap={1.2}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tagColor(r.nom), flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'Outfit' }}>
                        {r.nom}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ py: 1.4, maxWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.74rem', color: TEXT_M, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description || <span style={{ color: '#c7d4e8' }}>—</span>}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 1.4 }}>
                    <Chip label={r.actif ? 'Active' : 'Inactive'} size="small" sx={{
                      fontSize: '0.65rem', fontWeight: 700, height: 22, borderRadius: '6px',
                      bgcolor: r.actif ? '#dcfce7' : SURF2,
                      color:   r.actif ? '#166534' : TEXT_M,
                      border:  `1px solid ${r.actif ? '#bbf7d0' : BORDER}`,
                    }} />
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                    <Stack direction="row" justifyContent="flex-end" gap={0.5}>

                      {/* Toggle — tout le monde */}
                      <Tooltip title={r.actif ? 'Désactiver' : 'Activer'}>
                        <IconButton size="small" onClick={() => handleToggle(r)} sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          color: r.actif ? '#16A34A' : TEXT_S,
                          bgcolor: r.actif ? '#f0fdf4' : SURF2,
                          '&:hover': { bgcolor: r.actif ? '#dcfce7' : '#e2e8f0' },
                        }}>
                          <PowerSettingsNew sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Modifier — tout le monde */}
                      <IconButton size="small" onClick={() => openEdit(r)} sx={{
                        width: 28, height: 28, borderRadius: '6px',
                        color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' },
                      }}>
                        <Edit sx={{ fontSize: 14 }} />
                      </IconButton>

                      {/* Supprimer — admin seulement */}
                      {isAdmin && (
                        <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' },
                        }}>
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WorkOutline sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucune affaire trouvée</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {search ? 'Modifiez votre recherche' : actifOnly ? 'Aucune affaire active' : 'Créez votre première affaire'}
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

      {/* DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isSmall}
        PaperProps={{ sx: { borderRadius: isSmall ? 0 : '14px', border: isSmall ? 'none' : `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>

        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, borderBottom: `1px solid ${SURF2}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WorkOutline sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD, fontFamily: 'Outfit' }}>
              {editing ? "Modifier l'affaire" : 'Nouvelle affaire'}
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: TEXT_S, fontFamily: 'Outfit' }}>
              {editing ? `Édition de ${editing.nom}` : "Remplissez les informations de l'affaire"}
            </Typography>
          </Box>
          {isSmall && (
            <IconButton size="small" onClick={() => setOpen(false)}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
          <Stack spacing={1.8}>
            <Field
              label="Nom *" value={form.nom}
              error={!!errors.nom} helperText={errors.nom}
              onChange={e => { setForm({ ...form, nom: e.target.value }); setErrors(er => ({ ...er, nom: undefined })) }}
            />
            <Field
              label="Description" value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              multiline rows={3}
            />
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
    </Box>
  )
}