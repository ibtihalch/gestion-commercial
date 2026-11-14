import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, TextField, Pagination,
  Dialog, DialogContent, Stack, InputAdornment,
  useMediaQuery, useTheme, Card, CardContent, Divider, Tooltip, Switch
} from '@mui/material'
import {
  Add, Edit, Delete, Search, People, Close, Clear,
  FileDownload, PowerSettingsNew
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import clientService from '../../services/clientService'
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

const EMPTY_FORM = { nom: '', adresse: '', telephone: '', email: '', ice: '', actif: true }

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
  <TextField
    label={label} value={value} onChange={onChange}
    fullWidth size="small" error={error} helperText={helperText}
    {...props} sx={{ ...sx_input, ...props.sx }}
  />
)

const initials = (nom) => nom?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const avatarColor = (nom) => {
  const colors = [BLUE, BLUE_D, '#7C3AED', '#0891B2', '#0369A1']
  let hash = 0
  for (const c of (nom || '')) hash += c.charCodeAt(0)
  return colors[hash % colors.length]
}

const Avatar = ({ nom, size = 32 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    bgcolor: avatarColor(nom) + '18',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ fontSize: size < 36 ? '0.6rem' : '0.72rem', fontWeight: 800, color: avatarColor(nom) }}>
      {initials(nom)}
    </Typography>
  </Box>
)

const ClientCard = ({ c, onEdit, onDelete, onToggle, isAdmin }) => (
  <Card sx={{
    border: `1px solid ${BORDER}`, borderRadius: '12px', mb: 1.5,
    boxShadow: 'none', transition: 'box-shadow .15s',
    opacity: c.actif ? 1 : 0.65,
    '&:hover': { boxShadow: '0 4px 12px rgba(26,111,232,0.08)' },
  }}>
    <CardContent sx={{ p: '12px 14px !important' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" gap={1.2} flex={1} mr={1}>
          <Avatar nom={c.nom} size={36} />
          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" gap={0.8} mb={0.3} flexWrap="wrap">
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                {c.nom}
              </Typography>
              <Chip label={c.actif ? 'Actif' : 'Inactif'} size="small" sx={{
                fontSize: '0.58rem', fontWeight: 700, height: 18, borderRadius: '5px',
                bgcolor: c.actif ? BG_PAGE : SURF2,
                color: c.actif ? BLUE_D : TEXT_M,
                border: `1px solid ${c.actif ? BLUE + '20' : BORDER}`,
              }} />
            </Stack>
            {c.adresse && (
              <Typography sx={{ fontSize: '0.67rem', color: TEXT_S, mb: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.adresse}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" gap={0.5} flexShrink={0}>
          {/* Toggle — tout le monde */}
          <Tooltip title={c.actif ? 'Désactiver' : 'Activer'}>
            <IconButton size="small" onClick={() => onToggle(c)} sx={{
              width: 30, height: 30, borderRadius: '7px',
              color: c.actif ? '#16A34A' : TEXT_S,
              bgcolor: c.actif ? '#f0fdf4' : SURF2,
              '&:hover': { bgcolor: c.actif ? '#dcfce7' : '#e2e8f0' },
            }}>
              <PowerSettingsNew sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          {/* Modifier — tout le monde */}
          <IconButton size="small" onClick={() => onEdit(c)} sx={{
            width: 30, height: 30, borderRadius: '7px',
            color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' },
          }}>
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>

          {/* Supprimer — admin seulement */}
          {isAdmin && (
            <IconButton size="small" onClick={() => onDelete(c.id)} sx={{
              width: 30, height: 30, borderRadius: '7px',
              color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' },
            }}>
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ my: 1, borderColor: SURF2 }} />

      <Stack direction="row" gap={2} flexWrap="wrap">
        <Box>
          <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>Téléphone</Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_M }}>
            {c.telephone || <span style={{ color: '#c7d4e8' }}>—</span>}
          </Typography>
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>Email</Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_M, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.email || <span style={{ color: '#c7d4e8' }}>—</span>}
          </Typography>
        </Box>
        {c.ice && (
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.2 }}>ICE</Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_M, fontFamily: 'monospace' }}>{c.ice}</Typography>
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
)

export default function ClientsPage() {
  const { user }  = useAuth()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall   = useMediaQuery(theme.breakpoints.down('sm'))
  const isAdmin = 
  user?.role === 'ROLE_ADMIN' ||
  user?.roles?.includes('ROLE_ADMIN') ||
  user?.authorities?.some(a => a.authority === 'ROLE_ADMIN') ||
  user?.login === 'admin'  // fallback temporaire
  console.log('user complet:', user)
console.log('user.role:', user?.role)
console.log('isAdmin:', isAdmin)

  const [clients,    setClients]    = useState([])
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search,     setSearch]     = useState('')
  const [actifOnly,  setActifOnly]  = useState(false)
  const [open,       setOpen]       = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [errors,     setErrors]     = useState({})
  const [exporting,  setExporting]  = useState(false)

  const load = useCallback(() => {
    clientService.getAll({
      page: page - 1, size: 10,
      entrepriseId: user?.entrepriseId,
      ...(search.trim() && { search: search.trim() }),
      ...(actifOnly     && { actifOnly: true }),
    })
      .then(data => { setClients(data.content || []); setTotalPages(data.totalPages || 1) })
      .catch(() => toast.error('Erreur de chargement'))
  }, [page, search, actifOnly, user?.entrepriseId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, actifOnly])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setOpen(true) }
  const openEdit   = (c)  => { setEditing(c);  setForm({ ...c });   setErrors({}); setOpen(true) }

  const validate = () => {
    const e = {}
    if (!form.nom?.trim())  e.nom = 'Le nom est obligatoire'
    if (!form.ice?.trim())  e.ice = "L'ICE est obligatoire"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      const payload = { ...form, entrepriseId: user?.entrepriseId }
      if (editing) await clientService.update(editing.id, payload)
      else         await clientService.create(payload)
      toast.success(editing ? 'Client modifié' : 'Client créé')
      setOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce client ?')) return
    try { await clientService.delete(id); toast.success('Client supprimé'); load() }
    catch { toast.error('Erreur suppression') }
  }

  const handleToggle = async (c) => {
    try {
      await clientService.toggleActif(c.id)
      toast.success(`Client ${c.actif ? 'désactivé' : 'activé'}`)
      load()
    } catch { toast.error('Erreur lors du changement de statut') }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await clientService.getAll({
        page: 0, size: 9999, entrepriseId: user?.entrepriseId,
        ...(search.trim() && { search: search.trim() }),
        ...(actifOnly     && { actifOnly: true }),
      })
      const all = data.content || []
      if (all.length === 0) { toast.error('Aucun client à exporter'); return }
      const ws = XLSX.utils.json_to_sheet(all.map(c => ({
        'Nom': c.nom || '', 'Adresse': c.adresse || '', 'Téléphone': c.telephone || '',
        'Email': c.email || '', 'ICE': c.ice || '', 'Statut': c.actif ? 'Actif' : 'Inactif',
      })))
      ws['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 10 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Clients')
      XLSX.writeFile(wb, `Clients_${dayjs().format('YYYYMMDD')}.xlsx`)
      toast.success(`${all.length} client(s) exporté(s)`)
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
            <People sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
              Clients
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500, display: { xs: 'none', sm: 'block' }, fontFamily: 'Outfit' }}>
              Liste et gestion des clients
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
            {isSmall ? <Add sx={{ fontSize: 18 }} /> : 'Nouveau client'}
          </Button>
        </Stack>
      </Stack>

      {/* FILTRES */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} mb={2} alignItems={{ sm: 'center' }}>
        <TextField
          size="small" placeholder="Rechercher un client..."
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
            Actifs seulement
          </Typography>
        </Box>
      </Stack>

      {/* TABLE desktop / CARDS mobile */}
      {isMobile ? (
        <Box>
          {clients.map(c => (
            <ClientCard key={c.id} c={c} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} isAdmin={isAdmin} />
          ))}
          {clients.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                <People sx={{ fontSize: 20, color: '#c7d4e8' }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucun client trouvé</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                {search ? 'Modifiez votre recherche' : actifOnly ? 'Aucun client actif' : 'Créez votre premier client'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: SURF3 }}>
                {['Client', 'Téléphone', 'Email', 'ICE', 'Statut', ''].map((h, i) => (
                  <TableCell key={i} align={i === 5 ? 'right' : 'left'} sx={{
                    fontSize: '0.62rem', fontWeight: 700, color: TEXT_S,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: `1px solid ${BORDER}`, py: 1.5,
                    px: i === 0 ? 2.5 : 2, fontFamily: 'Outfit',
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c, idx) => (
                <TableRow key={c.id} sx={{
                  opacity: c.actif ? 1 : 0.6,
                  '&:hover': { bgcolor: SURF3 },
                  borderBottom: idx === clients.length - 1 ? 'none' : `1px solid ${SURF2}`,
                  transition: 'background .1s',
                }}>
                  <TableCell sx={{ px: 2.5, py: 1.4 }}>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Avatar nom={c.nom} size={30} />
                      <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, lineHeight: 1.2, fontFamily: 'Outfit' }}>
                          {c.nom}
                        </Typography>
                        {c.adresse && (
                          <Typography sx={{ fontSize: '0.63rem', color: TEXT_S }}>{c.adresse}</Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.76rem', color: TEXT_M, py: 1.4 }}>
                    {c.telephone || <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.76rem', color: TEXT_M, py: 1.4 }}>
                    {c.email || <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  <TableCell sx={{ py: 1.4 }}>
                    {c.ice
                      ? <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_M, fontFamily: 'monospace' }}>{c.ice}</Typography>
                      : <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  <TableCell sx={{ py: 1.4 }}>
                    <Chip label={c.actif ? 'Actif' : 'Inactif'} size="small" sx={{
                      fontSize: '0.65rem', fontWeight: 700, height: 22, borderRadius: '6px',
                      bgcolor: c.actif ? BG_PAGE : SURF2,
                      color: c.actif ? BLUE_D : TEXT_M,
                      border: `1px solid ${c.actif ? BLUE + '20' : BORDER}`,
                    }} />
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                    <Stack direction="row" justifyContent="flex-end" gap={0.5}>

                      {/* Toggle — tout le monde */}
                      <Tooltip title={c.actif ? 'Désactiver' : 'Activer'}>
                        <IconButton size="small" onClick={() => handleToggle(c)} sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          color: c.actif ? '#16A34A' : TEXT_S,
                          bgcolor: c.actif ? '#f0fdf4' : SURF2,
                          '&:hover': { bgcolor: c.actif ? '#dcfce7' : '#e2e8f0' },
                        }}>
                          <PowerSettingsNew sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Modifier — tout le monde */}
                      <IconButton size="small" onClick={() => openEdit(c)} sx={{
                        width: 28, height: 28, borderRadius: '6px',
                        color: BLUE, bgcolor: BG_PAGE, '&:hover': { bgcolor: BLUE + '20' },
                      }}>
                        <Edit sx={{ fontSize: 14 }} />
                      </IconButton>

                      {/* Supprimer — admin seulement */}
                      {isAdmin && (
                        <IconButton size="small" onClick={() => handleDelete(c.id)} sx={{
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

              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <People sx={{ fontSize: 20, color: '#c7d4e8' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_S, fontFamily: 'Outfit' }}>Aucun client trouvé</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8', fontFamily: 'Outfit' }}>
                        {search ? 'Modifiez votre recherche' : actifOnly ? 'Aucun client actif' : 'Créez votre premier client'}
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
            <People sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD, fontFamily: 'Outfit' }}>
              {editing ? 'Modifier le client' : 'Nouveau client'}
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: TEXT_S, fontFamily: 'Outfit' }}>
              {editing ? `Édition de ${editing.nom}` : 'Remplissez les informations du client'}
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
              onChange={e => setForm({ ...form, nom: e.target.value })}
              error={!!errors.nom} helperText={errors.nom}
            />
            <Field label="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Field label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              <Field label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Stack>
            <Field
              label="ICE *" value={form.ice}
              onChange={e => setForm({ ...form, ice: e.target.value })}
              error={!!errors.ice} helperText={errors.ice}
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