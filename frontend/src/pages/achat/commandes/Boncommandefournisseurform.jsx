import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Grid, TextField, Button, IconButton,
  Autocomplete, Table, TableBody, TableCell, TableHead, TableRow,
  Stack, Tooltip,
} from '@mui/material'
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material'
import { useAuth } from '../../../context/AuthContext'
import bonCommandeFournisseurService from '../../../services/Boncommandefournisseurservice'
import fournisseurService from '../../../services/fournisseurService'
import affaireService     from '../../../services/affaireService'
import articleService     from '../../../services/articleService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'

const emptyLine = {
  articleId: null, articleCode: '', articleDesignation: '',
  qte: 1, prixUnitaire: 0, montant: 0,
}

const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ title, action, children }) {
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{
        bgcolor: '#fafbfe', borderBottom: '1px solid #e2e8f0',
        px: 2.5, py: 1.1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography sx={{
          fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
          letterSpacing: '0.06em', color: '#94a3b8',
        }}>
          {title}
        </Typography>
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
export default function BonCommandeFournisseurForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit   = Boolean(id)

  const [fournisseurs, setFournisseurs] = useState([])
  const [affaires,     setAffaires]     = useState([])
  const [articles,     setArticles]     = useState([])
  const [saving,       setSaving]       = useState(false)

  const [form, setForm] = useState({
    fournisseurId:       null,
    affaireId:           null,
    dateCommande:        dayjs().format('YYYY-MM-DD'),
    dateLivraisonPrevue: '',
    observations:        '',
    conditionsPaiement:  '',   // ← nouveau
    entrepriseId:        user?.entrepriseId,
  })

  const [lines, setLines] = useState([{ ...emptyLine }])

  // ── Totaux ────────────────────────────────────────────────────────────────
  const totalHt  = lines.reduce((s, l) => s + Number(l.montant || 0), 0)
  const tva      = totalHt * 0.20
  const totalTtc = totalHt + tva

const loadLists = () => {
  const params = { size: 200, entrepriseId: user?.entrepriseId, actifOnly: true }
  fournisseurService.getAll(params).then(d => setFournisseurs(d.content || []))
  affaireService.getAll(params).then(d => setAffaires(d.content || []))
  articleService.getAll({ size: 500, entrepriseId: user?.entrepriseId, actifOnly: true })
    .then(d => setArticles(d.content || []))
}

  useEffect(() => {
    loadLists()

    if (isEdit) {
      bonCommandeFournisseurService.getById(id).then(d => {
        setForm({
          fournisseurId:       d.fournisseurId,
          affaireId:           d.affaireId,
          dateCommande:        d.dateCommande,
          dateLivraisonPrevue: d.dateLivraisonPrevue || '',
          observations:        d.observations        || '',
          conditionsPaiement:  d.conditionsPaiement  || '',   // ← nouveau
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
      }).catch(() => toast.error('Bon de commande introuvable'))
    }
  }, [id])

  // ── Rechargement auto quand l'onglet reprend le focus ────────────────────
  useEffect(() => {
    const onFocus = () => loadLists()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

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
        prixUnitaire:       Number(article.prixAchat ?? article.prixVente),
        montant:            Number(next[index].qte) * Number(article.prixAchat ?? article.prixVente),
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
        await bonCommandeFournisseurService.update(id, payload)
        toast.success('Bon de commande mis à jour')
      } else {
        await bonCommandeFournisseurService.create(payload)
        toast.success('Bon de commande créé avec succès')
      }
 navigate('/achat/commandes')
    } catch {
      toast.error("Erreur lors de l'enregistrement")
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
          onClick={() => navigate('/achat/commandes')}
          sx={{
            width: 30, height: 30, borderRadius: '8px', bgcolor: '#EEF2FB',
            color: BLUE_DD, '&:hover': { bgcolor: '#dbeafe' },
          }}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
            {isEdit ? 'Modifier le bon de commande fournisseur' : 'Nouveau bon de commande fournisseur'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
            {isEdit ? `Modification · ID ${id}` : 'Remplissez les informations ci-dessous'}
          </Typography>
        </Box>
      </Stack>

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

            {/* ── Dates ── */}
            <Grid item xs={12} md={2}>
              <TextField
                label="Date commande" type="date" fullWidth size="small"
                value={form.dateCommande}
                onChange={e => setForm(f => ({ ...f, dateCommande: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                label="Livraison prévue" type="date" fullWidth size="small"
                value={form.dateLivraisonPrevue}
                onChange={e => setForm(f => ({ ...f, dateLivraisonPrevue: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            {/* ── Observations + Conditions côte à côte ── */}
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
                placeholder={"Exemple :\n100% à la livraison\nDélai de livraison : 30 jours\nDélai d'option : 1 mois"}
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
              { label: 'Total HT',  val: `${fmt(totalHt)} MAD`,  bg: 'white', border: '1px solid #e2e8f0', color: BLUE_DD   },
              { label: 'TVA 20 %',  val: `${fmt(tva)} MAD`,      bg: 'white', border: '1px solid #e2e8f0', color: '#64748b' },
              { label: 'Total TTC', val: `${fmt(totalTtc)} MAD`, bg: ORANGE,  border: 'none',               color: 'white'   },
            ].map(({ label, val, bg, border, color }, idx) => (
              <Box
                key={label}
                sx={{
                  width: 280,
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
      <Stack direction="row" gap={2} justifyContent="flex-end">
        <Button
          onClick={() => navigate('/achat/commandes')}
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
          {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le bon de commande'}
        </Button>
      </Stack>

    </Box>
  )
}