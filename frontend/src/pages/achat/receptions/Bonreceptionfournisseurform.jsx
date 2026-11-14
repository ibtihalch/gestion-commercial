import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Grid, TextField, Button, IconButton,
  Autocomplete, Table, TableBody, TableCell, TableHead, TableRow,
  Stack, Alert, Tooltip,
} from '@mui/material'
import { Add, Delete, Save, ArrowBack, Inventory, Assignment, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../../context/AuthContext'
import bonReceptionFournisseurService from '../../../services/bonReceptionFournisseurService'
import bonCommandeFournisseurService  from '../../../services/Boncommandefournisseurservice'
import fournisseurService             from '../../../services/fournisseurService'
import affaireService                 from '../../../services/affaireService'
import articleService                 from '../../../services/articleService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'

const emptyLine = {
  articleId: null, articleCode: '', articleDesignation: '', unite: '',
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

// ═════════════════════════════════════════════════════════════════════════════
export default function BonReceptionFournisseurForm() {
  const { id }             = useParams()
  const [searchParams]     = useSearchParams()
  const navigate           = useNavigate()
  const { user }           = useAuth()
  const isEdit             = Boolean(id)

  const bcfIdFromQuery = searchParams.get('bcfId')

  const [fournisseurs, setFournisseurs] = useState([])
  const [affaires,     setAffaires]     = useState([])
  const [articles,     setArticles]     = useState([])
  const [allBcfs,      setAllBcfs]      = useState([])
  const [saving,       setSaving]       = useState(false)
  const [bcfInfo,      setBcfInfo]      = useState(null)
  const [bcfLoading,   setBcfLoading]   = useState(false)

  const [form, setForm] = useState({
    fournisseurId:            null,
    affaireId:                null,
    bonCommandeFournisseurId: null,
    dateReception:            dayjs().format('YYYY-MM-DD'),
    observations:             '',
    entrepriseId:             user?.entrepriseId,
    statut:                   'en_cours',
  })

  const [lines, setLines] = useState([{ ...emptyLine }])

  const totalHt = lines.reduce((s, l) => s + Number(l.montant || 0), 0)

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    const params = { size: 200, entrepriseId: user?.entrepriseId, actifOnly: true }
  fournisseurService.getAll(params).then(d => setFournisseurs(d.content || []))
  affaireService.getAll(params).then(d => setAffaires(d.content || []))
  articleService.getAll({ size: 500, entrepriseId: user?.entrepriseId, actifOnly: true })
    .then(d => setArticles(d.content || []))
  bonCommandeFournisseurService.getAll({ size: 500, entrepriseId: user?.entrepriseId })
    .then(d => setAllBcfs(d.content || []))
      .catch(() => {})

    if (isEdit) {
      bonReceptionFournisseurService.getById(id).then(d => {
        setForm({
          fournisseurId:            d.fournisseurId,
          affaireId:                d.affaireId,
          bonCommandeFournisseurId: d.bonCommandeFournisseurId || null,
          dateReception:            d.dateReception || dayjs().format('YYYY-MM-DD'),
          observations:             d.observations || '',
          entrepriseId:             d.entrepriseId,
          statut:                   d.statut || 'en_cours',
        })
        setLines(
          d.details?.map(det => ({
            articleId:          det.articleId,
            articleCode:        det.articleCode,
            articleDesignation: det.articleDesignation,
            unite:              det.unite || '',
            qte:                det.qte,
            prixUnitaire:       Number(det.prixUnitaire),
            montant:            Number(det.montant),
          })) || [{ ...emptyLine }]
        )
        if (d.bonCommandeFournisseurId) {
          bonCommandeFournisseurService.getById(d.bonCommandeFournisseurId)
            .then(bcf => setBcfInfo(bcf))
            .catch(() => {})
        }
      }).catch(() => toast.error('Bon de réception introuvable'))
    } else if (bcfIdFromQuery) {
      loadBcf(bcfIdFromQuery)
    }
  }, [id, bcfIdFromQuery])

  // ── Charger un BCF ────────────────────────────────────────────────────────
  const loadBcf = (bcfId) => {
    if (!bcfId) return
    setBcfLoading(true)
    bonCommandeFournisseurService.getById(bcfId).then(bcf => {
      setBcfInfo(bcf)
      setForm(f => ({
        ...f,
        fournisseurId:            bcf.fournisseurId,
        affaireId:                bcf.affaireId || null,
        bonCommandeFournisseurId: bcf.id,
      }))
      setLines(
        bcf.details?.map(det => ({
          articleId:          det.articleId,
          articleCode:        det.articleCode,
          articleDesignation: det.articleDesignation,
          unite:              det.unite || '',
          qte:                det.qte,
          prixUnitaire:       Number(det.prixUnitaire),
          montant:            Number(det.montant),
        })) || [{ ...emptyLine }]
      )
      toast.success(`BCF ${bcf.numero} chargé — lignes pré-remplies`)
    }).catch(() => toast.error('BCF introuvable'))
      .finally(() => setBcfLoading(false))
  }

  const handleBcfSelect = (_, bcf) => {
    if (!bcf) {
      setBcfInfo(null)
      setForm(f => ({ ...f, bonCommandeFournisseurId: null, fournisseurId: null, affaireId: null }))
      setLines([{ ...emptyLine }])
      return
    }
    loadBcf(bcf.id)
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
        unite:              article.unite || '',
        prixUnitaire:       Number(article.prixAchat || article.prixVente || 0),
        montant:            Number(next[index].qte) * Number(article.prixAchat || article.prixVente || 0),
      }
      return next
    })
  }

  const addLine    = () => setLines(prev => [...prev, { ...emptyLine }])
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i))

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.fournisseurId) { toast.error('Sélectionnez un fournisseur'); return }
    if (lines.some(l => !l.articleId)) {
      toast.error('Chaque ligne doit avoir un article'); return
    }
    const payload = {
      ...form,
      dateReception: form.dateReception || null,
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
        await bonReceptionFournisseurService.update(id, payload)
        toast.success('Bon de réception mis à jour')
      } else {
        await bonReceptionFournisseurService.create(payload)
        toast.success('Bon de réception créé — stock augmenté')
      }
      navigate('/achat/receptions')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || ''
      toast.error(msg || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <Box>

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
          onClick={() => navigate('/achat/receptions')}
          sx={{
            width: 30, height: 30, borderRadius: '8px', bgcolor: '#EEF2FB',
            color: BLUE_DD, '&:hover': { bgcolor: '#dbeafe' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{
          width: 30, height: 30, borderRadius: '8px', bgcolor: '#EEF2FB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Inventory sx={{ fontSize: 16, color: BLUE }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
            {isEdit ? 'Modifier le bon de réception' : 'Nouveau bon de réception fournisseur'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
            {isEdit
              ? `Modification · ID ${id}`
              : bcfInfo
                ? `Créé depuis le BCF : ${bcfInfo.numero}`
                : 'Remplissez les informations ci-dessous'}
          </Typography>
        </Box>
      </Stack>

      {/* ── SÉLECTION BCF (création uniquement) ───────────────────────────── */}
      {!isEdit && (
        <SectionCard
          title="Bon de commande fournisseur (optionnel)"
          subtitle="Sélectionnez un BCF existant pour pré-remplir automatiquement le formulaire"
        >
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={allBcfs}
                  getOptionLabel={b => b.numero ? `${b.numero} — ${b.fournisseurNom || ''}` : ''}
                  value={allBcfs.find(b => b.id === form.bonCommandeFournisseurId) || null}
                  onChange={handleBcfSelect}
                  loading={bcfLoading}
                  renderInput={p => (
                    <TextField
                      {...p}
                      label="Rechercher un bon de commande fournisseur"
                      fullWidth size="small"
                      placeholder="Numéro BCF ou nom fournisseur…"
                      InputProps={{
                        ...p.InputProps,
                        startAdornment: (
                          <>
                            <Assignment sx={{ color: BLUE, fontSize: 18, mr: 0.5 }} />
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
                        <Assignment sx={{ color: BLUE, fontSize: 16, flexShrink: 0 }} />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: BLUE_DD }}>
                            {option.numero}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.fournisseurNom}
                          </Typography>
                        </Box>
                        <Box sx={{
                          fontSize: '0.65rem', fontWeight: 700, px: '8px', height: '20px',
                          display: 'inline-flex', alignItems: 'center', borderRadius: '5px',
                          bgcolor: '#EEF2FB', color: BLUE, border: `1px solid ${BLUE}30`,
                        }}>
                          {option.statut || 'en_cours'}
                        </Box>
                      </Stack>
                    </Box>
                  )}
                />
              </Grid>

              {/* Résumé BCF sélectionné */}
              {bcfInfo && (
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', px: 2, py: 1.2,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}>
                    <CheckCircle sx={{ color: '#16a34a', fontSize: 20, flexShrink: 0 }} />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#166534' }}>
                        BCF {bcfInfo.numero} chargé
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bcfInfo.fournisseurNom}
                        {bcfInfo.details?.length ? ` · ${bcfInfo.details.length} article(s)` : ''}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: BLUE, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => {
                        setBcfInfo(null)
                        setForm(f => ({ ...f, bonCommandeFournisseurId: null, fournisseurId: null, affaireId: null }))
                        setLines([{ ...emptyLine }])
                      }}
                    >
                      Effacer
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {!bcfInfo && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Sans sélection, vous pouvez saisir les informations manuellement ci-dessous.
              </Typography>
            )}
          </Box>
        </SectionCard>
      )}

      {/* ── ALERTE BCF LIÉ (lien direct) ─────────────────────────────────── */}
      {bcfInfo && bcfIdFromQuery && (
        <Alert
          severity="info"
          sx={{
            mb: 2.5, borderRadius: 2,
            border: `1px solid ${BLUE}30`,
            bgcolor: '#EEF2FB',
            '& .MuiAlert-icon': { color: BLUE },
          }}
          icon={false}
        >
          <Typography variant="body2" fontWeight={600} sx={{ color: BLUE_DD }}>
            📋 Lié au BCF : <strong>{bcfInfo.numero}</strong> — {bcfInfo.fournisseurNom}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Les lignes ont été pré-remplies depuis la commande fournisseur. Vous pouvez les ajuster.
          </Typography>
        </Alert>
      )}

      {/* ── INFORMATIONS GÉNÉRALES ─────────────────────────────────────────── */}
      <SectionCard title="Informations générales">
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>

            {/* ── Fournisseur ── */}
            <Grid item xs={12} md={4}>
              <Stack direction="row" gap={1} alignItems="center">
                <Autocomplete
                  fullWidth
                  options={fournisseurs}
                  getOptionLabel={f => f.nom || ''}
                  value={fournisseurs.find(f => f.id === form.fournisseurId) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, fournisseurId: v?.id || null }))}
                  renderInput={p => (
                    <TextField {...p} label="Fournisseur *" fullWidth size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                  )}
                />
                <QuickAddBtn href="/fournisseurs?new=true" tooltip="Nouveau fournisseur" />
              </Stack>
            </Grid>

            {/* ── Affaire ── */}
            <Grid item xs={12} md={3}>
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

            {/* ── Date de réception ── */}
            <Grid item xs={12} md={2}>
              <TextField
                label="Date de réception" type="date" fullWidth size="small"
                value={form.dateReception}
                onChange={e => setForm(f => ({ ...f, dateReception: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            {/* ── BCF lié ── */}
            <Grid item xs={12} md={3}>
              <TextField
                label="BCF lié"
                fullWidth size="small"
                value={bcfInfo ? `${bcfInfo.numero}` : form.bonCommandeFournisseurId || ''}
                InputProps={{ readOnly: true }}
                helperText={bcfInfo ? `Fournisseur : ${bcfInfo.fournisseurNom}` : 'Sélectionnez un BCF ci-dessus'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    bgcolor: bcfInfo ? '#f0fdf4' : 'transparent',
                  },
                }}
              />
            </Grid>

            {/* ── Observations ── */}
            <Grid item xs={12}>
              <TextField
                label="Observations" fullWidth multiline rows={2} size="small"
                value={form.observations}
                onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

          </Grid>
        </Box>
      </SectionCard>

      {/* ── LIGNES D'ARTICLES ──────────────────────────────────────────────── */}
      <SectionCard
        title="Articles reçus"
        subtitle="L'augmentation du stock se fait à la création du BRF"
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
            Ajouter une ligne
          </Button>
        }
      >
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { label: 'Article',       align: 'left',  width: 'auto' },
                  { label: 'Qté reçue',     align: 'right', width: 100    },
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
                  {/* ── Article avec bouton + ── */}
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

                  {/* ── Qté ── */}
                                   <TableCell align="right" sx={{ py: 0.8 }}>
                                     <TextField
                                       size="small" type="number" value={line.qte}
                                       inputProps={{ min: 1, style: { textAlign: 'right' } }}
                                       onChange={e => updateLine(i, 'qte', e.target.value)}
                                       sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                     />
                                   </TableCell>
                  {/* ── Prix unitaire ── */}
                  <TableCell align="right" sx={{ py: 0.8 }}>
                    <TextField
                      size="small" type="number" value={line.prixUnitaire}
                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                      onChange={e => updateLine(i, 'prixUnitaire', e.target.value)}
                      sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </TableCell>

                  {/* ── Montant ── */}
                  <TableCell align="right" sx={{ py: 0.8 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE }}>
                      {fmt(line.montant)} MAD
                    </Typography>
                  </TableCell>

                  {/* ── Supprimer ── */}
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

        {/* ── Totaux ────────────────────────────────────────────────────────── */}
        <Box sx={{ borderTop: '1px solid #e2e8f0', px: 2.5, py: 2 }}>
          <Stack alignItems="flex-end" gap={0}>
            {[
              { label: 'Total HT',  val: `${fmt(totalHt)} MAD`,          bg: 'white', border: '1px solid #e2e8f0', color: BLUE_DD   },
              { label: 'TVA 20 %',  val: `${fmt(totalHt * 0.20)} MAD`,   bg: 'white', border: '1px solid #e2e8f0', color: '#64748b' },
              { label: 'Total TTC', val: `${fmt(totalHt * 1.20)} MAD`,   bg: ORANGE,  border: 'none',               color: 'white'   },
            ].map(({ label, val, bg, border, color }, idx) => (
              <Box
                key={label}
                sx={{
                  width: 280,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: bg, border,
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
      <Stack direction="row" gap={2} justifyContent="flex-end">
        <Button
          onClick={() => navigate('/achat/receptions')}
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
          sx={{
            bgcolor: BLUE, color: 'white', borderRadius: '8px',
            fontSize: '0.78rem', fontWeight: 700, textTransform: 'none',
            px: 2.5, py: 0.8, fontFamily: 'Outfit',
            boxShadow: `0 4px 12px ${BLUE}30`,
            '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
            '&.Mui-disabled': { opacity: 0.5 },
          }}
        >
          {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le bon de réception'}
        </Button>
      </Stack>

    </Box>
  )
}