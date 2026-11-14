import { useEffect, useState, useRef } from 'react'
import {
  Box, Typography, Grid, TextField, Button, Stack, Divider,
  CircularProgress, Alert, Tooltip, IconButton,
} from '@mui/material'
import {
  Business, Edit, Save, Cancel, Language, Phone, Email,
  AccountBalance, Badge, LocationOn, Description, Fax,
  PhotoCamera, DeleteOutline,
} from '@mui/icons-material'
import entrepriseService from '../../services/entrepriseService'
import toast from 'react-hot-toast'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'

// ─── Champs formulaire ────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'nom',            label: 'Nom de la société',  icon: Business,       required: true,  xs: 12, md: 6 },
  { key: 'responsable',    label: 'Responsable',         icon: Badge,           required: false, xs: 12, md: 6 },
  { key: 'email',          label: 'Email',               icon: Email,           required: false, xs: 12, md: 6 },
  { key: 'telephone',      label: 'Téléphone',           icon: Phone,           required: false, xs: 12, md: 6 },
  { key: 'fax',            label: 'Fax',                 icon: Fax,             required: false, xs: 12, md: 6 },
  { key: 'siteWeb',        label: 'Site web',            icon: Language,        required: false, xs: 12, md: 6 },
  { key: 'adresse',        label: 'Adresse',             icon: LocationOn,      required: false, xs: 12, multiline: true, rows: 2 },
  { key: 'ice',            label: 'ICE',                 icon: AccountBalance,  required: false, xs: 12, md: 4 },
  { key: 'ifiscale',       label: 'Identifiant fiscal',  icon: AccountBalance,  required: false, xs: 12, md: 4 },
  { key: 'rc',             label: 'RC',                  icon: AccountBalance,  required: false, xs: 12, md: 4 },
  { key: 'cnss',           label: 'CNSS',                icon: AccountBalance,  required: false, xs: 12, md: 6 },
  { key: 'patente',        label: 'Patente',             icon: AccountBalance,  required: false, xs: 12, md: 6 },
  { key: 'compteBancaire', label: 'Compte bancaire',     icon: AccountBalance,  required: false, xs: 12 },
  { key: 'description',    label: 'Description',         icon: Description,     required: false, xs: 12, multiline: true, rows: 3 },
]

const EMPTY = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// ─── Champ formulaire stylé ───────────────────────────────────────────────────
const StyledField = ({ field, value, onChange, disabled }) => {
  const IconComp = field.icon
  return (
    <TextField
      fullWidth
      size="small"
      label={field.label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={field.required}
      multiline={!!field.multiline}
      rows={field.rows}
      InputProps={{
        startAdornment: (
          <Box sx={{ color: '#94a3b8', mr: 1, display: 'flex', alignItems: 'center' }}>
            <IconComp sx={{ fontSize: 16 }} />
          </Box>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          fontSize: '0.82rem',
          bgcolor: disabled ? '#fafbfe' : 'white',
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: disabled ? '#e2e8f0' : BLUE + '60' },
          '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
          '&.Mui-disabled': { bgcolor: '#fafbfe' },
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.78rem',
          color: '#64748b',
          '&.Mui-focused': { color: BLUE },
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: '#475569',
        },
      }}
    />
  )
}

// ─── Titre de section ─────────────────────────────────────────────────────────
const SectionTitle = ({ icon: IconComp, children }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={2}>
    <Box sx={{
      width: 24, height: 24, borderRadius: '6px', bgcolor: '#EEF2FB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconComp sx={{ fontSize: 14, color: BLUE }} />
    </Box>
    <Typography sx={{
      fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </Typography>
  </Stack>
)

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EntrepriseSettings({ entrepriseId }) {
  const [data,          setData]          = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [editing,       setEditing]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [logoPreview,   setLogoPreview]   = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const fileInputRef = useRef(null)

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        let entreprise
        if (entrepriseId) {
          entreprise = await entrepriseService.getById(entrepriseId)
        } else {
          const page = await entrepriseService.getAll({ page: 0, size: 1 })
          entreprise = page?.content?.[0] ?? (Array.isArray(page) ? page[0] : page)
        }
        if (!entreprise) throw new Error('Aucune entreprise trouvée')
        setData(entreprise)
        setForm(toForm(entreprise))
      } catch (e) {
        setError(e.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [entrepriseId])

  useEffect(() => {
    return () => { if (logoPreview) URL.revokeObjectURL(logoPreview) }
  }, [logoPreview])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toForm = (e) => FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: e[f.key] ?? '' }), {})

  const handleEdit   = () => { setForm(toForm(data)); setLogoPreview(null); setEditing(true) }
  const handleCancel = () => { setForm(toForm(data)); setLogoPreview(null); setEditing(false) }

  const handleSave = async () => {
    if (!form.nom?.trim()) { toast.error('Le nom est obligatoire'); return }
    setSaving(true)
    try {
      // ✅ FIX : on préserve le logo déjà uploadé dans data.logo
      const updated = await entrepriseService.update(data.id, { ...form, logo: data.logo })
      setData(updated)
      setEditing(false)
      setLogoPreview(null)
      toast.success('Entreprise mise à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  // ── Logo ────────────────────────────────────────────────────────────────────
  const handleLogoClick  = () => { if (editing && !logoUploading) fileInputRef.current?.click() }

  const handleLogoChange = async (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Fichier image requis'); return }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Image trop lourde (max 2 Mo)'); return }
    setLogoPreview(URL.createObjectURL(file))
    setLogoUploading(true)
    try {
      const updated = await entrepriseService.uploadLogo(data.id, file)
      // ✅ FIX : on met à jour data avec le nouveau logo retourné par le serveur
      setData(updated)
      setForm(toForm(updated))
      toast.success('Logo mis à jour')
    } catch {
      toast.error("Erreur lors de l'upload du logo")
      setLogoPreview(null)
    } finally {
      setLogoUploading(false)
      ev.target.value = ''
    }
  }

  const handleLogoRemove = async () => {
    try {
      const updated = await entrepriseService.update(data.id, { ...form, logo: '' })
      setData(updated)
      setForm(toForm(updated))
      setLogoPreview(null)
      toast.success('Logo supprimé')
    } catch {
      toast.error('Erreur lors de la suppression du logo')
    }
  }

  const resolveLogoUrl   = (path) => {
    if (!path) return null
    return path.startsWith('http') ? path : `${API_BASE}${path}`
  }
  const currentLogoUrl   = logoPreview || resolveLogoUrl(data?.logo)

  // ── Initiales avatar ────────────────────────────────────────────────────────
  const logoInitials = (nom) =>
    (nom || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  // ── États de chargement ─────────────────────────────────────────────────────
  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress sx={{ color: BLUE }} />
      </Box>
    )

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2, borderRadius: '10px' }}>{error}</Alert>
    )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── BANDE DÉGRADÉ ──────────────────────────────────────────────────── */}
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER CARD ────────────────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2,
        px: 2.5, py: 2, mb: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Stack direction="row" alignItems="center" gap={2}>

          {/* Zone logo / avatar */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Tooltip
              title={editing ? (currentLogoUrl ? 'Changer le logo' : 'Ajouter un logo') : ''}
              placement="bottom"
            >
              <Box
                onClick={handleLogoClick}
                sx={{
                  width: 52, height: 52, borderRadius: '12px',
                  bgcolor: currentLogoUrl ? 'transparent' : '#EEF2FB',
                  border: editing
                    ? `2px dashed ${BLUE}`
                    : '2px solid #e2e8f0',
                  cursor: editing ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  '&:hover': editing ? { opacity: 0.8 } : {},
                }}
              >
                {logoUploading ? (
                  <CircularProgress size={22} sx={{ color: BLUE }} />
                ) : currentLogoUrl ? (
                  <Box
                    component="img"
                    src={currentLogoUrl}
                    alt="logo"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: BLUE }}>
                    {logoInitials(data?.nom)}
                  </Typography>
                )}
              </Box>
            </Tooltip>

            {/* Badge caméra */}
            {editing && !logoUploading && (
              <Box
                onClick={handleLogoClick}
                sx={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 20, height: 20, borderRadius: '50%',
                  bgcolor: BLUE, border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.12)',
                }}
              >
                <PhotoCamera sx={{ fontSize: 10, color: 'white' }} />
              </Box>
            )}

            {/* Badge supprimer logo */}
            {editing && currentLogoUrl && !logoUploading && (
              <Tooltip title="Supprimer le logo">
                <IconButton
                  size="small"
                  onClick={handleLogoRemove}
                  sx={{
                    position: 'absolute', top: -8, right: -8,
                    width: 20, height: 20, p: 0,
                    bgcolor: '#ef4444', color: 'white',
                    '&:hover': { bgcolor: '#dc2626' },
                  }}
                >
                  <DeleteOutline sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleLogoChange}
          />

          {/* Nom + sous-titre */}
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
              {data.nom}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
              Paramètres de l'entreprise
            </Typography>
            {editing && (
              <Typography sx={{ fontSize: '0.63rem', color: BLUE, mt: 0.3 }}>
                Cliquez sur le logo pour le modifier
              </Typography>
            )}
          </Box>

          {/* Chip ICE */}
          {data.ice && (
            <Box sx={{
              fontSize: '0.65rem', fontWeight: 700,
              px: '10px', height: '22px',
              display: 'inline-flex', alignItems: 'center',
              borderRadius: '6px',
              bgcolor: '#EEF2FB', color: BLUE_DD,
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
            }}>
              ICE : {data.ice}
            </Box>
          )}
        </Stack>

        {/* Boutons action */}
        {!editing ? (
          <Button
            onClick={handleEdit}
            startIcon={<Edit sx={{ fontSize: '15px !important' }} />}
            sx={{
              bgcolor: BLUE, color: 'white', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
              px: 2, py: 0.8, fontFamily: 'Outfit',
              boxShadow: `0 4px 12px ${BLUE}30`,
              '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
            }}
          >
            Modifier
          </Button>
        ) : (
          <Stack direction="row" gap={1}>
            <Button
              onClick={handleCancel}
              disabled={saving}
              startIcon={<Cancel sx={{ fontSize: '15px !important' }} />}
              sx={{
                fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                color: '#64748b', borderRadius: '8px', px: 2, fontFamily: 'Outfit',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              startIcon={
                saving
                  ? <CircularProgress size={14} sx={{ color: 'white' }} />
                  : <Save sx={{ fontSize: '15px !important' }} />
              }
              sx={{
                bgcolor: BLUE, color: 'white', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                px: 2, py: 0.8, fontFamily: 'Outfit',
                boxShadow: `0 4px 12px ${BLUE}30`,
                '&:hover': { bgcolor: BLUE_D },
                '&.Mui-disabled': { bgcolor: BLUE + '60', color: 'white' },
              }}
            >
              Enregistrer
            </Button>
          </Stack>
        )}
      </Box>

      {/* ── SECTION : Informations générales ─────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5, mb: 2 }}>
        <SectionTitle icon={Business}>Informations générales</SectionTitle>
        <Grid container spacing={2}>
          {FIELDS.slice(0, 7).map(f => (
            <Grid item xs={f.xs} md={f.md} key={f.key}>
              <StyledField
                field={f}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={!editing}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── SECTION : Informations légales & bancaires ────────────────────── */}
      <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
        <SectionTitle icon={AccountBalance}>Informations légales &amp; bancaires</SectionTitle>
        <Grid container spacing={2}>
          {FIELDS.slice(7).map(f => (
            <Grid item xs={f.xs} md={f.md} key={f.key}>
              <StyledField
                field={f}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={!editing}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Pied de page ─────────────────────────────────────────────────── */}
      {data.dateCreation && (
        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 2, display: 'block' }}>
          Créée le {new Date(data.dateCreation).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </Typography>
      )}

    </Box>
  )
}