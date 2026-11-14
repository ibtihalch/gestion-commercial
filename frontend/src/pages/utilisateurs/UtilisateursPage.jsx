import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, TextField, Pagination,
  Dialog, DialogContent, Stack, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, OutlinedInput, Tooltip,
} from '@mui/material'
import {
  Add, Edit, Delete, Search, People, Person, PowerSettingsNew
} from '@mui/icons-material'
import utilisateurService from '../../services/utilisateurService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'

// ─── Constantes rôles ─────────────────────────────────────────────────────────
const ALL_ROLES = ['ROLE_ADMIN', 'ROLE_VENDEUR', 'ROLE_ACHETEUR', 'ROLE_MAGASINIER', 'ROLE_CONSULTANT']

const ROLE_LABEL = {
  ROLE_ADMIN: 'Admin', ROLE_VENDEUR: 'Vendeur', ROLE_ACHETEUR: 'Acheteur',
  ROLE_MAGASINIER: 'Magasinier', ROLE_CONSULTANT: 'Consultant',
}

const ROLE_STYLE = {
  ROLE_ADMIN:      { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  ROLE_VENDEUR:    { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  ROLE_ACHETEUR:   { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  ROLE_MAGASINIER: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  ROLE_CONSULTANT: { bg: '#e0f2fe', color: '#0c4a6e', border: '#bae6fd' },
}

const EMPTY = {
  login: '', motDePasse: '', nom: '', prenom: '',
  email: '', telephone: '', actif: true, roles: [],
}

// ─── Helpers avatar ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [BLUE, BLUE_D, '#7C3AED', '#0891B2', '#059669']
const initials = (nom, prenom) =>
  ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?'
const avatarColor = (nom) => {
  let h = 0
  for (const c of (nom || '')) h += c.charCodeAt(0)
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ─── Champ formulaire stylé ───────────────────────────────────────────────────
const Field = ({ label, value, onChange, ...props }) => (
  <TextField
    label={label}
    value={value}
    onChange={onChange}
    fullWidth
    size="small"
    {...props}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        fontSize: '0.82rem',
        '& fieldset': { borderColor: '#e2e8f0' },
        '&:hover fieldset': { borderColor: BLUE + '60' },
        '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.78rem', color: '#64748b',
        '&.Mui-focused': { color: BLUE },
      },
      ...props.sx,
    }}
  />
)

// ─── Composant principal ──────────────────────────────────────────────────────
export default function UtilisateursPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [rows,       setRows]       = useState([])
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search,     setSearch]     = useState('')
  const [open,       setOpen]       = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)

  // ── Chargement ──────────────────────────────────────────────────────────────
  const load = () => {
    utilisateurService
      .getAll({ page: page - 1, size: 10, entrepriseId: user?.entrepriseId })
      .then(d => {
        setRows(d.data || d.content || [])
        setTotalPages(d.totalPages || 1)
      })
      .catch(() => toast.error('Erreur de chargement'))
  }

  useEffect(() => { load() }, [page])

  // ── Dialogue ─────────────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (r)  => {
    setEditing(r)
    setForm({ ...r, motDePasse: '', roles: Array.from(r.roles || []) })
    setOpen(true)
  }
  const handleClose = () => { setOpen(false); setEditing(null); setForm(EMPTY) }

  const handleSave = async () => {
    if (!form.login.trim())           { toast.error('Le login est obligatoire');              return }
    if (!editing && !form.motDePasse) { toast.error('Le mot de passe est obligatoire');       return }
    if (form.motDePasse && form.motDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères'); return
    }
    if (form.roles.length === 0) { toast.error('Sélectionnez au moins un rôle'); return }
    try {
      const payload = { ...form, entrepriseId: user?.entrepriseId }
      if (editing) {
        await utilisateurService.update(editing.id, payload)
        toast.success('Utilisateur modifié')
      } else {
        await utilisateurService.create(payload)
        toast.success('Utilisateur créé')
      }
      handleClose()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    }
  }

  // ── Suppression ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    try {
      await utilisateurService.delete(id)
      toast.success('Utilisateur supprimé')
      if (rows.length === 1 && page > 1) setPage(p => p - 1)
      else load()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // ── Toggle actif / inactif ───────────────────────────────────────────────────
  const handleToggle = async (r) => {
    try {
      await utilisateurService.toggleActif(r.id)
      toast.success(`Utilisateur ${r.actif ? 'désactivé' : 'activé'}`)
      load()
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  // ── Filtre local ─────────────────────────────────────────────────────────────
  const filtered = rows.filter(r =>
    r.login?.toLowerCase().includes(search.toLowerCase()) ||
    r.nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Helper indicateur mot de passe ───────────────────────────────────────────
  const pwdTooShort = form.motDePasse.length > 0 && form.motDePasse.length < 8

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── BANDE DÉGRADÉ ────────────────────────────────────────────────────── */}
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        mb={2.5}
        sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, px: 2.5, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px', bgcolor: '#EEF2FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <People sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
              Utilisateurs
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
              Liste et gestion des utilisateurs
            </Typography>
          </Box>
        </Stack>

        <Button
          onClick={openCreate}
          startIcon={<Add sx={{ fontSize: '16px !important' }} />}
          sx={{
            bgcolor: BLUE, color: 'white', borderRadius: '8px',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
            px: 2, py: 0.8, fontFamily: 'Outfit',
            boxShadow: `0 4px 12px ${BLUE}30`,
            '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
          }}
        >
          Nouvel utilisateur
        </Button>
      </Stack>

      {/* ── BARRE DE RECHERCHE ───────────────────────────────────────────────── */}
      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 17, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', fontSize: '0.78rem', bgcolor: 'white',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: BLUE + '50' },
              '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
            },
            '& input::placeholder': { color: '#94a3b8', fontSize: '0.78rem' },
          }}
        />
      </Box>

      {/* ── TABLE ────────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#fafbfe' }}>
              {['Utilisateur', 'Login', 'Email', 'Rôles', 'Statut', ''].map((h, i) => (
                <TableCell
                  key={i}
                  align={i === 5 ? 'right' : 'left'}
                  sx={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid #e2e8f0', py: 1.5,
                    px: i === 0 ? 2.5 : 2,
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((r, idx) => {
              const col  = avatarColor(r.nom)
              const init = initials(r.nom, r.prenom)
              const last = idx === filtered.length - 1
              return (
                <TableRow
                  key={r.id}
                  sx={{
                    opacity: r.actif ? 1 : 0.55,
                    '&:hover': { bgcolor: '#fafbfe' },
                    borderBottom: last ? 'none' : '1px solid #f1f5f9',
                    transition: 'background .1s',
                  }}
                >
                  {/* Nom + avatar */}
                  <TableCell sx={{ px: 2.5, py: 1.4 }}>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box sx={{
                        width: 30, height: 30, borderRadius: '50%',
                        bgcolor: col + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: col }}>
                          {init}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, lineHeight: 1.2 }}>
                          {r.nom} {r.prenom}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Login */}
                  <TableCell sx={{ fontSize: '0.76rem', fontWeight: 600, color: BLUE_DD, py: 1.4 }}>
                    {r.login}
                  </TableCell>

                  {/* Email */}
                  <TableCell sx={{ fontSize: '0.76rem', color: '#475569', py: 1.4 }}>
                    {r.email || <span style={{ color: '#c7d4e8' }}>—</span>}
                  </TableCell>

                  {/* Rôles */}
                  <TableCell sx={{ py: 1.4 }}>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {(r.roles || []).map(role => {
                        const s = ROLE_STYLE[role] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
                        return (
                          <Box
                            key={role}
                            sx={{
                              fontSize: '0.62rem', fontWeight: 700,
                              px: '8px', height: '20px',
                              display: 'inline-flex', alignItems: 'center',
                              borderRadius: '6px',
                              bgcolor: s.bg, color: s.color,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            {ROLE_LABEL[role] || role.replace('ROLE_', '')}
                          </Box>
                        )
                      })}
                    </Stack>
                  </TableCell>

                  {/* Statut */}
                  <TableCell sx={{ py: 1.4 }}>
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: '0.65rem', fontWeight: 700,
                      px: '10px', height: '22px', borderRadius: '6px',
                      bgcolor : r.actif ? '#dcfce7' : '#f1f5f9',
                      color   : r.actif ? '#166534' : '#64748b',
                      border  : `1px solid ${r.actif ? '#bbf7d0' : '#e2e8f0'}`,
                    }}>
                      {r.actif ? 'Actif' : 'Inactif'}
                    </Box>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ py: 1.4, pr: 2 }}>
                    <Stack direction="row" justifyContent="flex-end" gap={0.5}>

                      {/* Toggle actif/inactif */}
                      <Tooltip title={r.actif ? 'Désactiver' : 'Activer'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggle(r)}
                          sx={{
                            width: 28, height: 28, borderRadius: '6px',
                            color  : r.actif ? '#16A34A' : '#64748b',
                            bgcolor: r.actif ? '#f0fdf4' : '#f1f5f9',
                            '&:hover': { bgcolor: r.actif ? '#dcfce7' : '#e2e8f0' },
                          }}
                        >
                          <PowerSettingsNew sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Voir profil */}
                      <Tooltip title="Voir le profil">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/profil/${r.id}`)}
                          sx={{
                            width: 28, height: 28, borderRadius: '6px',
                            color: '#0c4a6e', bgcolor: '#e0f2fe',
                            '&:hover': { bgcolor: '#bae6fd' },
                          }}
                        >
                          <Person sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Modifier */}
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(r)}
                          sx={{
                            width: 28, height: 28, borderRadius: '6px',
                            color: BLUE, bgcolor: '#EEF2FB',
                            '&:hover': { bgcolor: BLUE + '20' },
                          }}
                        >
                          <Edit sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Supprimer */}
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(r.id)}
                          sx={{
                            width: 28, height: 28, borderRadius: '6px',
                            color: '#ef4444', bgcolor: '#fef2f2',
                            '&:hover': { bgcolor: '#fee2e2' },
                          }}
                        >
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '10px', bgcolor: '#EEF2FB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <People sx={{ fontSize: 20, color: '#c7d4e8' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                      Aucun utilisateur trouvé
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#c7d4e8' }}>
                      Modifiez votre recherche ou créez un nouvel utilisateur
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* ── PAGINATION ───────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="center" mt={2.5}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          size="small"
          sx={{
            '& .MuiPaginationItem-root': {
              fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px',
              color: '#64748b', fontFamily: 'Outfit',
              '&:hover': { bgcolor: '#EEF2FB', color: BLUE },
            },
            '& .Mui-selected': {
              bgcolor: `${BLUE} !important`,
              color: 'white !important',
            },
          }}
        />
      </Box>

      {/* ── DIALOG CRÉATION / ÉDITION ─────────────────────────────────────────── */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* Header dialog */}
        <Box sx={{
          px: 3, pt: 2.5, pb: 2,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px', bgcolor: '#EEF2FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <People sx={{ fontSize: 17, color: BLUE }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: BLUE_DD }}>
              {editing ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: '#94a3b8' }}>
              {editing
                ? `Édition de ${editing.nom} ${editing.prenom}`
                : 'Remplissez les informations du compte'}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={1.8}>

            {/* Login + Mot de passe */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Field
                  label="Login *"
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                  disabled={!!editing}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Field
                  label={editing ? 'Mot de passe (optionnel)' : 'Mot de passe *'}
                  type="password"
                  value={form.motDePasse}
                  onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                  inputProps={{ autoComplete: 'new-password' }}
                  sx={{
                    '& .MuiOutlinedInput-root fieldset': {
                      borderColor: pwdTooShort ? '#ef4444 !important' : undefined,
                    },
                  }}
                />
                {pwdTooShort && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Box sx={{
                      width: 14, height: 14, borderRadius: '50%',
                      bgcolor: '#fef2f2', border: '1px solid #fecaca',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>!</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.63rem', color: '#ef4444', fontWeight: 600 }}>
                      Minimum 8 caractères ({form.motDePasse.length}/8)
                    </Typography>
                  </Box>
                )}
                {form.motDePasse.length >= 8 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Box sx={{
                      width: 14, height: 14, borderRadius: '50%',
                      bgcolor: '#dcfce7', border: '1px solid #bbf7d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>✓</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.63rem', color: '#166534', fontWeight: 600 }}>
                      Mot de passe valide
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>

            {/* Nom + Prénom */}
            <Stack direction="row" spacing={1.5}>
              <Field
                label="Nom *"
                value={form.nom || ''}
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
              <Field
                label="Prénom *"
                value={form.prenom || ''}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
              />
            </Stack>

            {/* Email + Téléphone */}
            <Stack direction="row" spacing={1.5}>
              <Field
                label="Email"
                type="email"
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <Field
                label="Téléphone"
                value={form.telephone || ''}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
              />
            </Stack>

            {/* Rôles */}
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.78rem', color: '#64748b', '&.Mui-focused': { color: BLUE } }}>
                Rôles *
              </InputLabel>
              <Select
                multiple
                value={form.roles || []}
                onChange={e => setForm({ ...form, roles: e.target.value })}
                input={<OutlinedInput label="Rôles *" />}
                sx={{
                  borderRadius: '8px', fontSize: '0.82rem',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: BLUE + '60' },
                  '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
                }}
                renderValue={selected => (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {selected.map(role => {
                      const s = ROLE_STYLE[role] || {}
                      return (
                        <Box key={role} sx={{
                          fontSize: '0.62rem', fontWeight: 700,
                          px: '8px', height: '20px',
                          display: 'inline-flex', alignItems: 'center',
                          borderRadius: '6px',
                          bgcolor: s.bg, color: s.color,
                          border: `1px solid ${s.border}`,
                        }}>
                          {ROLE_LABEL[role] || role.replace('ROLE_', '')}
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              >
                {ALL_ROLES.map(role => {
                  const s = ROLE_STYLE[role] || {}
                  return (
                    <MenuItem key={role} value={role} sx={{ fontSize: '0.82rem' }}>
                      <Box sx={{
                        fontSize: '0.68rem', fontWeight: 700,
                        px: '8px', height: '22px',
                        display: 'inline-flex', alignItems: 'center',
                        borderRadius: '6px',
                        bgcolor: s.bg, color: s.color,
                        border: `1px solid ${s.border}`,
                      }}>
                        {ROLE_LABEL[role]}
                      </Box>
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>

            {/* Statut — uniquement en édition */}
            {editing && (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.78rem', color: '#64748b', '&.Mui-focused': { color: BLUE } }}>
                  Statut
                </InputLabel>
                <Select
                  value={form.actif ? 'actif' : 'inactif'}
                  onChange={e => setForm({ ...form, actif: e.target.value === 'actif' })}
                  input={<OutlinedInput label="Statut" />}
                  sx={{
                    borderRadius: '8px', fontSize: '0.82rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: BLUE + '60' },
                    '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
                  }}
                >
                  <MenuItem value="actif" sx={{ fontSize: '0.82rem' }}>
                    <Box sx={{
                      fontSize: '0.65rem', fontWeight: 700, px: '10px', height: '22px',
                      display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
                      bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                    }}>Actif</Box>
                  </MenuItem>
                  <MenuItem value="inactif" sx={{ fontSize: '0.82rem' }}>
                    <Box sx={{
                      fontSize: '0.65rem', fontWeight: 700, px: '10px', height: '22px',
                      display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
                      bgcolor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                    }}>Inactif</Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}

          </Stack>
        </DialogContent>

        {/* Footer dialog */}
        <Box sx={{
          px: 3, py: 2, borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 1,
        }}>
          <Button
            onClick={handleClose}
            sx={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
              color: '#64748b', borderRadius: '8px', px: 2, fontFamily: 'Outfit',
              '&:hover': { bgcolor: '#f1f5f9' },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={pwdTooShort}
            sx={{
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              bgcolor: BLUE, color: 'white', borderRadius: '8px', px: 2.5,
              fontFamily: 'Outfit',
              boxShadow: `0 4px 12px ${BLUE}30`,
              '&:hover': { bgcolor: BLUE_D },
              '&.Mui-disabled': { bgcolor: '#c7d4e8', color: 'white', boxShadow: 'none' },
            }}
          >
            Enregistrer
          </Button>
        </Box>
      </Dialog>

    </Box>
  )
}