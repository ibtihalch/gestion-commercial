import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Grid, TextField, Button, IconButton,
  Autocomplete, Table, TableBody, TableCell, TableHead, TableRow,
  Stack, Tooltip, Alert, Chip, useMediaQuery, useTheme,
} from '@mui/material'
import { Add, Delete, Save, ArrowBack, Description, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../../context/AuthContext'
import bonCommandeClientService from '../../../services/bonCommandeClientService'
import clientService            from '../../../services/clientService'
import affaireService           from '../../../services/affaireService'
import articleService           from '../../../services/articleService'
import devisService             from '../../../services/devisService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLUE     = '#1A6FE8'
const BLUE_D   = '#1558B0'
const BLUE_DD  = '#0E3D9C'
const ORANGE   = '#F59E0B'
const GREEN    = '#16A34A'
const GREEN_BG = '#F0FDF4'

const emptyLine = {
  articleId: null, articleCode: '', articleDesignation: '',
  qte: 1, prixUnitaire: 0, montant: 0,
}

const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, action, children }) {
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{
        bgcolor: '#fafbfe', borderBottom: '1px solid #e2e8f0',
        px: 2.5, py: 1.1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box>
          <Typography sx={{
            fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#94a3b8',
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.2 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  )
}

// ─── QuickAddBtn ──────────────────────────────────────────────────────────────
function QuickAddBtn({ href, tooltip }) {
  return (
    <Tooltip title={tooltip} placement="top">
      <IconButton
        size="small"
        onClick={() => window.open(href, '_blank')}
        sx={{
          width: 32, height: 32, borderRadius: '8px',
          bgcolor: '#EEF2FB', color: BLUE, flexShrink: 0,
          border: `1px solid ${BLUE}30`,
          transition: 'all .15s',
          '&:hover': { bgcolor: BLUE, color: 'white', borderColor: BLUE },
        }}
      >
        <Add sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  )
}

// ─── MobileLineCard ──────────────────────────────────────────────────────────
function MobileLineCard({ line, index, articles, lines, onUpdate, onSelect, onRemove }) {
  return (
    <Box sx={{
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      p: 1.5,
      mb: 1.5,
      bgcolor: index % 2 === 0 ? 'white' : '#fafbfe',
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ligne {index + 1}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onRemove(index)}
          disabled={lines.length === 1}
          sx={{
            width: 26, height: 26, borderRadius: '6px',
            color: '#ef4444', bgcolor: '#fef2f2',
            '&:hover': { bgcolor: '#fee2e2' },
            '&.Mui-disabled': { opacity: 0.3 },
          }}
        >
          <Delete sx={{ fontSize: 13 }} />
        </IconButton>
      </Stack>

      {/* Article */}
      <Stack direction="row" gap={0.5} alignItems="center" mb={1.2}>
        <Autocomplete
          fullWidth
          options={articles}
          getOptionLabel={a => `${a.code} — ${a.designation?.substring(0, 40) || ''}`}
          value={articles.find(a => a.id === line.articleId) || null}
          onChange={(_, v) => onSelect(index, v)}
          renderInput={p => (
            <TextField {...p} size="small" placeholder="Rechercher un article"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          )}
          size="small"
        />
        <QuickAddBtn href="/articles?new=true" tooltip="Nouvel article" />
      </Stack>

      {/* Qté + Prix + Montant */}
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, mb: 0.3 }}>Quantité</Typography>
          <TextField
            size="small" type="number" value={line.qte}
            inputProps={{ min: 1, style: { textAlign: 'right' } }}
            onChange={e => onUpdate(index, 'qte', e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item xs={5}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, mb: 0.3 }}>Prix unitaire</Typography>
          <TextField
            size="small" type="number" value={line.prixUnitaire}
            inputProps={{ min: 0, style: { textAlign: 'right' } }}
            onChange={e => onUpdate(index, 'prixUnitaire', e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item xs={3}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, mb: 0.3 }}>Montant HT</Typography>
          <Box sx={{
            height: 40, borderRadius: '8px',
            bgcolor: '#EEF2FB', border: `1px solid ${BLUE}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            px: 1,
          }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: BLUE, fontFamily: 'monospace' }}>
              {fmt(line.montant)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function BonCommandeClientForm() {
  const { id }             = useParams()
  const [searchParams]     = useSearchParams()
  const navigate           = useNavigate()
  const { user }           = useAuth()
  const isEdit             = Boolean(id)
  const theme              = useTheme()
  const isMobile           = useMediaQuery(theme.breakpoints.down('md'))

  const devisIdFromQuery = searchParams.get('devisId')

  const [clients,      setClients]      = useState([])
  const [affaires,     setAffaires]     = useState([])
  const [articles,     setArticles]     = useState([])
  const [allDevis,     setAllDevis]     = useState([])
  const [saving,       setSaving]       = useState(false)
  const [devisInfo,    setDevisInfo]    = useState(null)
  const [devisLoading, setDevisLoading] = useState(false)

  const [form, setForm] = useState({
    clientId:            null,
    affaireId:           null,
    devisId:             null,
    dateCommande:        dayjs().format('YYYY-MM-DD'),
    dateLivraisonPrevue: '',
    observations:        '',
    conditionsPaiement:  '',
    entrepriseId:        user?.entrepriseId,
  })

  const [lines, setLines] = useState([{ ...emptyLine }])

  // ── Totaux ────────────────────────────────────────────────────────────────
  const totalHt  = lines.reduce((s, l) => s + Number(l.montant || 0), 0)
  const tva      = totalHt * 0.20
  const totalTtc = totalHt + tva

 const loadLists = () => {
  const params = { size: 200, entrepriseId: user?.entrepriseId, actifOnly: true }
  clientService.getAll(params).then(d => setClients(d.content || []))
  affaireService.getAll(params).then(d => setAffaires(d.content || []))
  articleService.getAll({ size: 500, entrepriseId: user?.entrepriseId, actifOnly: true })
    .then(d => setArticles(d.content || []))
  devisService.getAll({ size: 500, entrepriseId: user?.entrepriseId })
    .then(d => setAllDevis(d.content || []))
    .catch(() => {})
}
  useEffect(() => {
    loadLists()

    if (isEdit) {
      bonCommandeClientService.getById(id).then(d => {
        setForm({
          clientId:            d.clientId,
          affaireId:           d.affaireId,
          devisId:             d.devisId || null,
          dateCommande:        d.dateCommande,
          dateLivraisonPrevue: d.dateLivraisonPrevue || '',
          observations:        d.observations        || '',
          conditionsPaiement:  d.conditionsPaiement  || '',
          entrepriseId:        d.entrepriseId,
        })
        setLines(
          d.details?.map(det => ({
            articleId:          det.articleId,
            articleCode:        det.articleCode,
            articleDesignation: det.articleDesignation,
            qte:                det.qte,
            prixUnitaire:       Number(det.prixUnitaire),
            montant:            Number(det.montant),
          })) || [{ ...emptyLine }]
        )
        if (d.devisId) {
          devisService.getById(d.devisId)
            .then(dv => setDevisInfo(dv))
            .catch(() => {})
        }
      }).catch(() => toast.error('Bon de commande introuvable'))

    } else if (devisIdFromQuery) {
      loadDevis(devisIdFromQuery)
    }
  }, [id, devisIdFromQuery])

  useEffect(() => {
    const onFocus = () => loadLists()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // ── Charger un devis ──────────────────────────────────────────────────────
  const loadDevis = (devisId) => {
    if (!devisId) return
    setDevisLoading(true)
    devisService.getById(devisId).then(dv => {
      setDevisInfo(dv)
      setForm(f => ({
        ...f,
        clientId:           dv.clientId,
        affaireId:          dv.affaireId  || null,
        devisId:            dv.id,
        conditionsPaiement: dv.conditionsPaiement || f.conditionsPaiement,
        observations:       dv.observations       || f.observations,
      }))
      setLines(
        dv.details?.map(det => ({
          articleId:          det.articleId,
          articleCode:        det.articleCode,
          articleDesignation: det.articleDesignation,
          qte:                det.qte,
          prixUnitaire:       Number(det.prixUnitaire),
          montant:            Number(det.montant),
        })) || [{ ...emptyLine }]
      )
      toast.success(`Devis ${dv.numero} chargé — lignes pré-remplies`)
    }).catch(() => toast.error('Devis introuvable'))
      .finally(() => setDevisLoading(false))
  }

  const handleDevisSelect = (_, dv) => {
    if (!dv) {
      setDevisInfo(null)
      setForm(f => ({ ...f, devisId: null, clientId: null, affaireId: null }))
      setLines([{ ...emptyLine }])
      return
    }
    loadDevis(dv.id)
  }

  const clearDevis = () => {
    setDevisInfo(null)
    setForm(f => ({ ...f, devisId: null, clientId: null, affaireId: null }))
    setLines([{ ...emptyLine }])
  }

  // ── Gestion des lignes ────────────────────────────────────────────────────
  const updateLine = (index, field, value) => {
    setLines(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'qte' || field === 'prixUnitaire') {
        const qte  = field === 'qte'          ? Number(value) : Number(next[index].qte)
        const prix = field === 'prixUnitaire' ? Number(value) : Number(next[index].prixUnitaire)
        next[index].montant = qte * prix
      }
      return next
    })
  }

  const selectArticle = (index, article) => {
    if (!article) return
    setLines(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        articleId:          article.id,
        articleCode:        article.code,
        articleDesignation: article.designation,
        prixUnitaire:       Number(article.prixVente),
        montant:            Number(next[index].qte) * Number(article.prixVente),
      }
      return next
    })
  }

  const addLine    = () => setLines(prev => [...prev, { ...emptyLine }])
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i))

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.clientId) { toast.error('Sélectionnez un client'); return }
    if (lines.some(l => !l.articleId)) {
      toast.error('Chaque ligne doit avoir un article'); return
    }
    const payload = {
      ...form,
      dateLivraisonPrevue: form.dateLivraisonPrevue || null,
      details: lines.map(l => ({
        articleId:    l.articleId,
        qte:          Number(l.qte),
        prixUnitaire: Number(l.prixUnitaire),
        montant:      Number(l.montant),
      })),
    }
    setSaving(true)
    try {
      if (isEdit) {
        await bonCommandeClientService.update(id, payload)
        toast.success('Bon de commande mis à jour')
      } else {
        await bonCommandeClientService.create(payload)
        toast.success('Bon de commande créé avec succès')
      }
      navigate('/vente/commandes')
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 0 } }}>

      {/* ── BANDE DÉGRADÉ ──────────────────────────────────────────────────── */}
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER CARD ────────────────────────────────────────────────────── */}
      <Stack
        direction="row" alignItems="center" gap={1.5} mb={2.5}
        sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, px: 2, py: 1.2 }}
      >
        <IconButton
          size="small"
          onClick={() => navigate('/vente/commandes')}
          sx={{
            width: 30, height: 30, borderRadius: '8px', bgcolor: '#EEF2FB',
            color: BLUE_DD, '&:hover': { bgcolor: '#dbeafe' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
            {isEdit ? 'Modifier le bon de commande' : 'Nouveau bon de commande'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
            {isEdit
              ? `Modification · ID ${id}`
              : devisInfo
                ? `Créé depuis le devis : ${devisInfo.numero}`
                : 'Remplissez les informations ci-dessous'}
          </Typography>
        </Box>
      </Stack>

      {/* ── ALERTE devis lié ─────────────────────────────────────────────── */}
      {devisInfo && devisIdFromQuery && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            mb: 2.5, borderRadius: 2,
            bgcolor: '#EEF2FB', border: `1px solid ${BLUE}30`,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD }}>
            📄 Lié au devis : <strong>{devisInfo.numero}</strong> — {devisInfo.clientNom}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
            Les lignes ont été pré-remplies depuis le devis. Vous pouvez les ajuster.
          </Typography>
        </Alert>
      )}

      {/* ── SÉLECTION DEVIS (création uniquement) ─────────────────────────── */}
      {!isEdit && (
        <SectionCard
          title="Devis (optionnel)"
          subtitle="Sélectionnez un devis existant pour pré-remplir automatiquement le formulaire"
        >
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={allDevis}
                  getOptionLabel={dv => dv.numero ? `${dv.numero} — ${dv.clientNom || ''}` : ''}
                  value={allDevis.find(dv => dv.id === form.devisId) || null}
                  onChange={handleDevisSelect}
                  loading={devisLoading}
                  renderInput={p => (
                    <TextField
                      {...p}
                      label="Rechercher un devis"
                      fullWidth size="small"
                      placeholder="Numéro devis ou nom client…"
                      InputProps={{
                        ...p.InputProps,
                        startAdornment: (
                          <>
                            <Description sx={{ color: BLUE, fontSize: 17, mr: 0.5 }} />
                            {p.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Stack direction="row" alignItems="center" gap={1} width="100%">
                        <Description sx={{ color: BLUE, fontSize: 15, flexShrink: 0 }} />
                        <Box flex={1}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD }}>
                            {option.numero}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {option.clientNom}{option.montantTtc ? ` · ${fmt(option.montantTtc)} MAD TTC` : ''}
                          </Typography>
                        </Box>
                        {option.statut && (
                          <Chip
                            label={option.statut}
                            size="small"
                            sx={{
                              fontSize : '0.62rem',
                              height   : 18,
                              bgcolor  : option.statut === 'accepte' ? GREEN_BG : '#EEF2FB',
                              color    : option.statut === 'accepte' ? GREEN    : BLUE,
                              border   : `1px solid ${option.statut === 'accepte' ? GREEN : BLUE}30`,
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  )}
                />
              </Grid>

              {devisInfo ? (
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    bgcolor: GREEN_BG, border: `1px solid ${GREEN}30`,
                    borderRadius: '8px', px: 2, py: 1.2,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}>
                    <CheckCircle sx={{ color: GREEN, fontSize: 18, flexShrink: 0 }} />
                    <Box flex={1}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: GREEN }}>
                        Devis {devisInfo.numero} chargé
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {devisInfo.clientNom}
                        {devisInfo.details?.length ? ` · ${devisInfo.details.length} article(s)` : ''}
                        {devisInfo.montantTtc ? ` · ${fmt(devisInfo.montantTtc)} MAD TTC` : ''}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.72rem', fontWeight: 600, color: BLUE,
                        cursor: 'pointer', flexShrink: 0,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={clearDevis}
                    >
                      Effacer
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Sans sélection, vous pouvez saisir les informations manuellement ci-dessous.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </SectionCard>
      )}

      {/* ── INFORMATIONS GÉNÉRALES ─────────────────────────────────────────── */}
      <SectionCard title="Informations générales">
        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Grid container spacing={2}>

            {/* ── Client ── */}
            <Grid item xs={12} md={4}>
              <Stack direction="row" gap={1} alignItems="center">
                <Autocomplete
                  fullWidth
                  options={clients}
                  getOptionLabel={c => c.nom || ''}
                  value={clients.find(c => c.id === form.clientId) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, clientId: v?.id || null }))}
                  renderInput={p => (
                    <TextField {...p} label="Client *" fullWidth size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                  )}
                />
                <QuickAddBtn href="/clients?new=true" tooltip="Nouveau client" />
              </Stack>
            </Grid>

            {/* ── Affaire ── */}
            <Grid item xs={12} md={4}>
              <Stack direction="row" gap={1} alignItems="center">
                <Autocomplete
                  fullWidth
                  options={affaires}
                  getOptionLabel={a => a.nom || ''}
                  value={affaires.find(a => a.id === form.affaireId) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, affaireId: v?.id || null }))}
                  renderInput={p => (
                    <TextField {...p} label="Affaire (optionnel)" fullWidth size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                  )}
                />
                <QuickAddBtn href="/affaires?new=true" tooltip="Nouvelle affaire" />
              </Stack>
            </Grid>

            {/* ── Devis lié (mode édition) ── */}
            {isEdit && (
              <Grid item xs={12} md={4}>
                <TextField
                  label="Devis lié"
                  fullWidth size="small"
                  value={devisInfo ? `${devisInfo.numero}` : form.devisId || ''}
                  InputProps={{ readOnly: true }}
                  helperText={devisInfo ? `Client : ${devisInfo.clientNom}` : 'Aucun devis lié'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      bgcolor: devisInfo ? GREEN_BG : 'transparent',
                    },
                  }}
                />
              </Grid>
            )}

            {/* ── Dates côte à côte sur mobile ── */}
            <Grid item xs={6} md={isEdit ? 3 : 2}>
              <TextField
                label="Date commande" type="date" fullWidth size="small"
                value={form.dateCommande}
                onChange={e => setForm(f => ({ ...f, dateCommande: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={6} md={isEdit ? 3 : 2}>
              <TextField
                label="Livraison prévue" type="date" fullWidth size="small"
                value={form.dateLivraisonPrevue}
                onChange={e => setForm(f => ({ ...f, dateLivraisonPrevue: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            {/* ── Observations ── */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Observations" fullWidth multiline rows={3} size="small"
                value={form.observations}
                onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            {/* ── Conditions de paiement ── */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Conditions générales"
                fullWidth multiline rows={3} size="small"
                placeholder={"Exemple :\n100% à la livraison\nDélai de livraison : Disponible\nDélai d'option : 1 mois sauf vente"}
                value={form.conditionsPaiement}
                onChange={e => setForm(f => ({ ...f, conditionsPaiement: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&.Mui-focused fieldset': { borderColor: BLUE },
                  },
                  '& label.Mui-focused': { color: BLUE },
                }}
              />
            </Grid>

          </Grid>
        </Box>
      </SectionCard>

      {/* ── LIGNES D'ARTICLES ──────────────────────────────────────────────── */}
      <SectionCard
        title="Lignes d'articles"
        action={
          <Button
            startIcon={<Add sx={{ fontSize: '15px !important' }} />}
            size="small"
            onClick={addLine}
            sx={{
              color: BLUE, borderColor: `${BLUE}50`, fontWeight: 700,
              fontSize: '0.72rem', border: `1px solid ${BLUE}50`,
              borderRadius: '8px', px: 1.5, textTransform: 'none',
              '&:hover': { bgcolor: `${BLUE}10`, borderColor: BLUE },
            }}
          >
            {isMobile ? 'Ajouter' : 'Ajouter une ligne'}
          </Button>
        }
      >

        {/* ── VUE MOBILE : cartes ── */}
        {isMobile ? (
          <Box sx={{ px: 1.5, pt: 1.5 }}>
            {lines.map((line, i) => (
              <MobileLineCard
                key={i}
                line={line}
                index={i}
                articles={articles}
                lines={lines}
                onUpdate={updateLine}
                onSelect={selectArticle}
                onRemove={removeLine}
              />
            ))}
          </Box>
        ) : (
          /* ── VUE DESKTOP : table ── */
          <Box sx={{ px: 1.5, pt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    { label: 'Article',       align: 'left',  width: 'auto' },
                    { label: 'Qté',           align: 'right', width: 90     },
                    { label: 'Prix unitaire', align: 'right', width: 145    },
                    { label: 'Montant HT',    align: 'right', width: 145    },
                    { label: '',              align: 'right', width: 48     },
                  ].map(({ label, align, width }) => (
                    <TableCell
                      key={label}
                      align={align}
                      sx={{
                        width,
                        fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '2px solid #e2e8f0', py: 1,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {lines.map((line, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      bgcolor: i % 2 === 0 ? 'white' : '#fafbfe',
                      '&:hover': { bgcolor: '#EEF2FB' },
                    }}
                  >
                    <TableCell sx={{ py: 0.8 }}>
                      <Stack direction="row" gap={0.5} alignItems="center">
                        <Autocomplete
                          fullWidth
                          options={articles}
                          getOptionLabel={a => `${a.code} — ${a.designation?.substring(0, 50) || ''}`}
                          value={articles.find(a => a.id === line.articleId) || null}
                          onChange={(_, v) => selectArticle(i, v)}
                          renderInput={p => (
                            <TextField {...p} size="small" placeholder="Rechercher un article"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                          )}
                          size="small"
                        />
                        <QuickAddBtn href="/articles?new=true" tooltip="Nouvel article" />
                      </Stack>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.8 }}>
                      <TextField
                        size="small" type="number" value={line.qte}
                        inputProps={{ min: 1, style: { textAlign: 'right' } }}
                        onChange={e => updateLine(i, 'qte', e.target.value)}
                        sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.8 }}>
                      <TextField
                        size="small" type="number" value={line.prixUnitaire}
                        inputProps={{ min: 0, style: { textAlign: 'right' } }}
                        onChange={e => updateLine(i, 'prixUnitaire', e.target.value)}
                        sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.8 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE }}>
                        {fmt(line.montant)} MAD
                      </Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ py: 0.8 }}>
                      <IconButton
                        size="small"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          color: '#ef4444', bgcolor: '#fef2f2',
                          '&:hover': { bgcolor: '#fee2e2' },
                          '&.Mui-disabled': { opacity: 0.3 },
                        }}
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* ── Totaux ────────────────────────────────────────────────────────── */}
        <Box sx={{ borderTop: '1px solid #e2e8f0', px: { xs: 1.5, md: 2.5 }, py: 2 }}>
          <Stack alignItems={{ xs: 'stretch', sm: 'flex-end' }} gap={0}>
            {[
              { label: 'Total HT',  val: `${fmt(totalHt)} MAD`,  bg: 'white', border: '1px solid #e2e8f0', color: BLUE_DD   },
              { label: 'TVA 20 %',  val: `${fmt(tva)} MAD`,      bg: 'white', border: '1px solid #e2e8f0', color: '#64748b' },
              { label: 'Total TTC', val: `${fmt(totalTtc)} MAD`, bg: ORANGE,  border: 'none',               color: 'white'   },
            ].map(({ label, val, bg, border, color }, idx) => (
              <Box
                key={label}
                sx={{
                  width: { xs: '100%', sm: 280 },
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: bg,
                  border,
                  borderTop: idx === 0 ? border : 'none',
                  borderRadius: idx === 2 ? '0 0 8px 8px' : 0,
                  px: 2, py: 0.8,
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color, fontFamily: 'monospace' }}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </SectionCard>

      {/* ── BOUTONS ACTION ─────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column-reverse', sm: 'row' }}
        gap={2}
        justifyContent="flex-end"
        sx={{ pb: { xs: 3, md: 0 } }}
      >
        <Button
          onClick={() => navigate('/vente/commandes')}
          fullWidth={isMobile}
          sx={{
            border: '1px solid #e2e8f0', color: BLUE_DD, fontWeight: 700,
            borderRadius: '8px', textTransform: 'none', px: 2.5, py: 0.8,
            fontFamily: 'Outfit', fontSize: '0.78rem',
            '&:hover': { bgcolor: '#EEF2FB', borderColor: `${BLUE}50` },
          }}
        >
          Annuler
        </Button>
        <Button
          startIcon={<Save sx={{ fontSize: '16px !important' }} />}
          onClick={handleSubmit}
          disabled={saving}
          fullWidth={isMobile}
          sx={{
            bgcolor: BLUE, color: 'white', borderRadius: '8px',
            fontSize: '0.78rem', fontWeight: 700, textTransform: 'none',
            px: 2.5, py: 0.8, fontFamily: 'Outfit',
            boxShadow: `0 4px 12px ${BLUE}30`,
            '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
            '&.Mui-disabled': { opacity: 0.5 },
          }}
        >
          {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le bon de commande'}
        </Button>
      </Stack>

    </Box>
  )
}