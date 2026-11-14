import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Stack, TextField,
  IconButton, InputAdornment, CircularProgress, Grid, Tooltip,
} from '@mui/material'
import {
  ArrowBack, Edit, Save, Cancel, Visibility, VisibilityOff,
  PhotoCamera, Person, Lock, Badge, Shield,
} from '@mui/icons-material'
import utilisateurService from '../../services/utilisateurService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const ROLE_LABELS = {
  ROLE_ADMIN: 'Administrateur', ROLE_VENDEUR: 'Vendeur',
  ROLE_ACHETEUR: 'Acheteur', ROLE_MAGASINIER: 'Magasinier', ROLE_CONSULTANT: 'Consultant',
}
const ROLE_STYLE = {
  ROLE_ADMIN:      { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  ROLE_VENDEUR:    { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  ROLE_ACHETEUR:   { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  ROLE_MAGASINIER: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  ROLE_CONSULTANT: { bg: '#e0f2fe', color: '#0c4a6e', border: '#bae6fd' },
}

const AVATAR_COLORS = [BLUE, BLUE_D, '#7C3AED', '#0891B2', '#059669']
const avatarColor = (nom) => {
  let h = 0; for (const c of (nom || '')) h += c.charCodeAt(0)
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ─── Champ formulaire ─────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', multiline, rows, helperText, error, InputProps, disabled }) => (
  <TextField
    label={label} value={value} onChange={onChange}
    type={type} multiline={multiline} rows={rows}
    helperText={helperText} error={error}
    disabled={disabled}
    fullWidth size="small"
    InputProps={InputProps}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '8px', fontSize: '0.82rem',
        '& fieldset': { borderColor: '#e2e8f0' },
        '&:hover fieldset': { borderColor: BLUE + '60' },
        '&.Mui-focused fieldset': { borderColor: BLUE, borderWidth: 1.5 },
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.78rem', color: '#64748b',
        '&.Mui-focused': { color: BLUE },
      },
      '& .MuiFormHelperText-root': { fontSize: '0.7rem' },
    }}
  />
)

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: IconComp, iconColor = BLUE, title, action, children }) {
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{
        px: 2.5, py: 1.5, bgcolor: '#fafbfe',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Box sx={{
            width: 24, height: 24, borderRadius: '6px', bgcolor: '#EEF2FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComp sx={{ fontSize: 14, color: iconColor }} />
          </Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </Typography>
        </Stack>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  )
}

function FieldDisplay({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: value ? BLUE_DD : '#c7d4e8', fontStyle: value ? 'normal' : 'italic' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

function EditButton({ onClick, label = 'Modifier' }) {
  return (
    <Button
      size="small"
      startIcon={<Edit sx={{ fontSize: '13px !important' }} />}
      onClick={onClick}
      sx={{
        fontSize: '0.72rem', fontWeight: 600, textTransform: 'none',
        color: '#64748b', borderRadius: '8px', px: 1.5, py: 0.5,
        border: '1px solid #e2e8f0', bgcolor: 'white', fontFamily: 'Outfit',
        '&:hover': { bgcolor: '#EEF2FB', borderColor: BLUE + '50', color: BLUE },
      }}
    >
      {label}
    </Button>
  )
}

function FormActions({ onCancel, onSave }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      <Button
        size="small"
        startIcon={<Cancel sx={{ fontSize: '13px !important' }} />}
        onClick={onCancel}
        sx={{
          fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
          color: '#64748b', borderRadius: '8px', px: 2, fontFamily: 'Outfit',
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
      >
        Annuler
      </Button>
      <Button
        size="small"
        startIcon={<Save sx={{ fontSize: '13px !important' }} />}
        onClick={onSave}
        sx={{
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
          bgcolor: BLUE, color: 'white', borderRadius: '8px', px: 2,
          fontFamily: 'Outfit', boxShadow: `0 4px 12px ${BLUE}30`,
          '&:hover': { bgcolor: BLUE_D },
        }}
      >
        Enregistrer
      </Button>
    </Stack>
  )
}

function AvatarSection({ user, uploading, onAvatarChange }) {
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase() || '?'
  const imgSrc   = user?.profil?.img
    ? user.profil.img.startsWith('http') ? user.profil.img : `${BASE_URL}${user.profil.img}`
    : undefined
  const col = avatarColor(user?.nom)

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: '14px',
        bgcolor: imgSrc ? 'transparent' : col + '18',
        border: `2px solid ${col}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {uploading ? (
          <CircularProgress size={24} sx={{ color: col }} />
        ) : imgSrc ? (
          <Box component="img" src={imgSrc} alt="avatar"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: col }}>
            {initials}
          </Typography>
        )}
      </Box>
      <Tooltip title="Changer la photo">
        <IconButton
          component="label"
          size="small"
          disabled={uploading}
          sx={{
            position: 'absolute', bottom: -6, right: -6,
            width: 24, height: 24,
            bgcolor: 'white', border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,.08)',
            '&:hover': { bgcolor: '#EEF2FB' },
          }}
        >
          <PhotoCamera sx={{ fontSize: 12, color: BLUE }} />
          <input type="file" hidden accept="image/*" onChange={onAvatarChange} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProfilPage() {
  const { id }                = useParams()
  const navigate              = useNavigate()
  const { user: currentUser } = useAuth()

  // ── FIX 403 : on détermine si on consulte son propre profil ou celui d'un autre
  // Pour son propre profil → on utilise getMe() (accessible à tous les rôles)
  // Pour le profil d'un autre utilisateur → getById() (admin seulement)
  const isSelfProfile = !id || id === 'me' || parseInt(id, 10) === currentUser?.id
  const resolvedId    = isSelfProfile ? currentUser?.id : parseInt(id, 10)

  const [userData,   setUserData]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [uploading,  setUploading]  = useState(false)

  const [editingInfo, setEditingInfo] = useState(false)
  const [infoForm,    setInfoForm]    = useState({})

  const [editingBio,  setEditingBio]  = useState(false)
  const [bioForm,     setBioForm]     = useState({})

  const [editingPwd,  setEditingPwd]  = useState(false)
  const [pwdForm,     setPwdForm]     = useState({ motDePasse: '', confirm: '' })
  const [showPwd,     setShowPwd]     = useState(false)

  const load = () => {
    setLoading(true)

    // ── FIX 403 : getMe() pour son propre profil, getById() pour un admin qui consulte un autre user
    const fetchPromise = isSelfProfile
      ? utilisateurService.getMe()          // GET /api/utilisateurs/me  — accessible à tous
      : utilisateurService.getById(resolvedId) // GET /api/utilisateurs/{id} — admin uniquement

    fetchPromise
      .then(data => {
        setUserData(data)
        setInfoForm({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || '',
        })
        setBioForm({
          poste: data.profil?.poste || '',
          bio: data.profil?.bio || '',
          signature: data.profil?.signature || '',
        })
      })
      .catch(() => toast.error('Utilisateur introuvable'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (resolvedId || isSelfProfile) load()
  }, [resolvedId, isSelfProfile])

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const url = await utilisateurService.uploadAvatar(resolvedId, file)
      setUserData(prev => ({ ...prev, profil: { ...prev.profil, img: url } }))
      toast.success('Photo de profil mise à jour')
      window.dispatchEvent(new Event('avatar-updated'))
    } catch {
      toast.error("Erreur lors de la mise à jour de la photo")
    } finally {
      setUploading(false); e.target.value = ''
    }
  }

  // ── Save info ───────────────────────────────────────────────────────────────
  const saveInfo = async () => {
    try {
      await utilisateurService.update(resolvedId, {
        ...userData, ...infoForm, motDePasse: undefined,
        roles: Array.from(userData.roles || []),
      })
      toast.success('Informations mises à jour')
      setEditingInfo(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  // ── Save bio ────────────────────────────────────────────────────────────────
  const saveBio = async () => {
    try {
      await utilisateurService.update(resolvedId, {
        ...userData, motDePasse: undefined,
        roles: Array.from(userData.roles || []),
        profil: { id: userData.profil?.id, img: userData.profil?.img, ...bioForm },
      })
      toast.success('Profil mis à jour')
      setEditingBio(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  // ── Save password ───────────────────────────────────────────────────────────
  const savePassword = async () => {
    if (pwdForm.motDePasse.length < 8) return toast.error('Minimum 8 caractères')
    if (pwdForm.motDePasse !== pwdForm.confirm) return toast.error('Les mots de passe ne correspondent pas')
    try {
      await utilisateurService.update(resolvedId, {
        ...userData, motDePasse: pwdForm.motDePasse, roles: Array.from(userData.roles || []),
      })
      toast.success('Mot de passe modifié')
      setEditingPwd(false); setPwdForm({ motDePasse: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  }

  const primaryRole = (userData?.roles || [])[0] || null

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress sx={{ color: BLUE }} />
      </Box>
    )

  if (!userData)
    return (
      <Box textAlign="center" mt={6}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Utilisateur introuvable.</Typography>
        <Button sx={{ mt: 2, fontSize: '0.75rem', textTransform: 'none', color: BLUE }}
          onClick={() => navigate(-1)} startIcon={<ArrowBack />}>Retour</Button>
      </Box>
    )

  return (
    <Box>

      {/* ── Bande dégradé ── */}
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── Header nav ── */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            width: 32, height: 32, borderRadius: '8px',
            border: '1px solid #e2e8f0', bgcolor: 'white',
            '&:hover': { bgcolor: '#EEF2FB', borderColor: BLUE + '50' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16, color: '#64748b' }} />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
            Profil utilisateur
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
            Gestion du compte
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>

        {/* ── Carte identité ── */}
        <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: `linear-gradient(90deg, ${BLUE} 0%, ${ORANGE} 60%, #fde68a 100%)` }} />
          <Box sx={{ px: 2.5, py: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'flex-start' }}>

              <AvatarSection user={userData} uploading={uploading} onAvatarChange={handleAvatarChange} />

              <Box flex={1}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
                  {userData.prenom} {userData.nom}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mb: 0.5 }}>
                  @{userData.login}
                </Typography>
                {userData.profil?.poste && (
                  <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', mb: 1 }}>
                    {userData.profil.poste}
                  </Typography>
                )}

                <Stack direction="row" flexWrap="wrap" gap={0.5} mb={1.5}>
                  {(userData.roles || []).map(role => {
                    const s = ROLE_STYLE[role] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
                    return (
                      <Box key={role} sx={{
                        fontSize: '0.62rem', fontWeight: 700, px: '8px', height: '20px',
                        display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
                        bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      }}>
                        {ROLE_LABELS[role] || role.replace('ROLE_', '')}
                      </Box>
                    )
                  })}
                  <Box sx={{
                    fontSize: '0.62rem', fontWeight: 700, px: '8px', height: '20px',
                    display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
                    bgcolor: userData.actif ? '#dcfce7' : '#f1f5f9',
                    color:   userData.actif ? '#166534' : '#64748b',
                    border: `1px solid ${userData.actif ? '#bbf7d0' : '#e2e8f0'}`,
                  }}>
                    {userData.actif ? 'Actif' : 'Inactif'}
                  </Box>
                </Stack>

                {primaryRole && (
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 1.5,
                    bgcolor: '#EEF2FB', border: `1px solid ${BLUE}20`,
                    borderRadius: '10px', px: 1.5, py: 1,
                  }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '7px', bgcolor: BLUE,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Shield sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Rôle principal
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD }}>
                        {ROLE_LABELS[primaryRole] || primaryRole.replace('ROLE_', '')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {userData.dateCreation && (
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  Créé le {new Date(userData.dateCreation).toLocaleDateString('fr-FR')}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>

        {/* ── Informations personnelles ── */}
        <SectionCard
          icon={Person}
          title="Informations personnelles"
          action={!editingInfo && <EditButton onClick={() => setEditingInfo(true)} />}
        >
          {!editingInfo ? (
            <Grid container spacing={2}>
              {[
                { label: 'Prénom',    value: userData.prenom },
                { label: 'Nom',       value: userData.nom },
                { label: 'Email',     value: userData.email },
                { label: 'Téléphone', value: userData.telephone },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <FieldDisplay label={label} value={value} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Stack spacing={1.8}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Field label="Prénom" value={infoForm.prenom}
                  onChange={e => setInfoForm({ ...infoForm, prenom: e.target.value })} />
                <Field label="Nom" value={infoForm.nom}
                  onChange={e => setInfoForm({ ...infoForm, nom: e.target.value })} />
              </Stack>
              <Field label="Email" type="email" value={infoForm.email}
                onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} />
              <Field label="Téléphone" value={infoForm.telephone}
                onChange={e => setInfoForm({ ...infoForm, telephone: e.target.value })} />
              <FormActions onCancel={() => setEditingInfo(false)} onSave={saveInfo} />
            </Stack>
          )}
        </SectionCard>

        {/* ── Bio & Poste ── */}
        <SectionCard
          icon={Badge}
          iconColor={ORANGE}
          title="Bio & Poste"
          action={!editingBio && <EditButton onClick={() => setEditingBio(true)} />}
        >
          {!editingBio ? (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FieldDisplay label="Poste" value={userData.profil?.poste} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                    Rôles
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {(userData.roles || []).map(role => {
                      const s = ROLE_STYLE[role] || {}
                      return (
                        <Box key={role} sx={{
                          fontSize: '0.62rem', fontWeight: 700, px: '8px', height: '20px',
                          display: 'inline-flex', alignItems: 'center', borderRadius: '6px',
                          bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
                        }}>
                          {ROLE_LABELS[role] || role.replace('ROLE_', '')}
                        </Box>
                      )
                    })}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <FieldDisplay label="Bio" value={userData.profil?.bio} />
                </Grid>
              </Grid>

              {userData.profil?.signature ? (
                <Box sx={{
                  bgcolor: '#fffbeb', borderLeft: `3px solid ${ORANGE}`,
                  borderRadius: '0 8px 8px 0', px: 2, py: 1.25,
                }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                    Signature
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#92400e', fontStyle: 'italic' }}>
                    {userData.profil.signature}
                  </Typography>
                </Box>
              ) : (
                <FieldDisplay label="Signature" value="" />
              )}
            </Stack>
          ) : (
            <Stack spacing={1.8}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Field label="Poste" value={bioForm.poste}
                  onChange={e => setBioForm({ ...bioForm, poste: e.target.value })} />
                <Field label="Signature" value={bioForm.signature}
                  onChange={e => setBioForm({ ...bioForm, signature: e.target.value })} />
              </Stack>
              <Field label="Bio" multiline rows={3} value={bioForm.bio}
                onChange={e => setBioForm({ ...bioForm, bio: e.target.value })} />
              <FormActions onCancel={() => setEditingBio(false)} onSave={saveBio} />
            </Stack>
          )}
        </SectionCard>

        {/* ── Mot de passe ── */}
        <SectionCard
          icon={Lock}
          title="Mot de passe"
          action={!editingPwd && <EditButton onClick={() => setEditingPwd(true)} label="Changer" />}
        >
          {!editingPwd ? (
            <Typography sx={{ color: '#c7d4e8', letterSpacing: 4, fontSize: '0.85rem' }}>
              ••••••••••••
            </Typography>
          ) : (
            <Stack spacing={1.8}>
              <Field
                label="Nouveau mot de passe"
                type={showPwd ? 'text' : 'password'}
                value={pwdForm.motDePasse}
                onChange={e => setPwdForm({ ...pwdForm, motDePasse: e.target.value })}
                helperText="Minimum 8 caractères"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd(v => !v)}
                        sx={{ color: '#94a3b8' }}>
                        {showPwd
                          ? <VisibilityOff sx={{ fontSize: 16 }} />
                          : <Visibility sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Field
                label="Confirmer le mot de passe"
                type={showPwd ? 'text' : 'password'}
                value={pwdForm.confirm}
                onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                error={pwdForm.confirm.length > 0 && pwdForm.motDePasse !== pwdForm.confirm}
                helperText={
                  pwdForm.confirm.length > 0 && pwdForm.motDePasse !== pwdForm.confirm
                    ? 'Les mots de passe ne correspondent pas'
                    : ''
                }
              />
              <FormActions
                onCancel={() => { setEditingPwd(false); setPwdForm({ motDePasse: '', confirm: '' }) }}
                onSave={savePassword}
              />
            </Stack>
          )}
        </SectionCard>

      </Stack>
    </Box>
  )
}
