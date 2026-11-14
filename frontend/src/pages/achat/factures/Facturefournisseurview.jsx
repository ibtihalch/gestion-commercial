import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Grid, Stack, Button, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Avatar
} from '@mui/material'
import { ArrowBack, Edit, PictureAsPdf } from '@mui/icons-material'
import factureFournisseurService from '../../../services/factureFournisseurService'
import entrepriseService         from '../../../services/entrepriseService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Palette (identique BCF) ──────────────────────────────────────────────────
const BLUE     = '#1A6FE8'
const BLUE_D   = '#1558B0'
const BLUE_DD  = '#0E3D9C'
const ORANGE   = '#F59E0B'
const VERT_CSS = '#16A34A'
const VERT_F   = '#15803D'
const VERT_BG  = '#F0FDF4'
const BG_PAGE  = '#EEF2FB'
const BORDER   = '#e2e8f0'
const TEXT_M   = '#64748b'
const TEXT_S   = '#94a3b8'
const SURFACE3 = '#fafbfe'
const ORANGE_BG = '#FFFBEB'
const ROUGE_CSS = '#DC2626'

// ─── Couleurs jsPDF (même que BCF) ────────────────────────────────────────────
const BLEU_GMT      = [0,   102, 204]
const BLEU_FONCE    = [0,   51,  102]
const ORANGE_GMT    = [255, 165, 0  ]
const ORANGE_CLAIR  = [255, 248, 230]
const BLEU_CLAIR_BG = [230, 242, 255]
const VERT_GMT      = [22,  163, 74 ]
const VERT_CLAIR    = [240, 253, 244]
const BLANC         = [255, 255, 255]
const NOIR          = [0,   0,   0  ]
const BLEU_DECO     = [173, 216, 230]
const ROUGE_GMT     = [220,  38,  38]

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const SF = (d, c) => d.setFillColor(c[0], c[1], c[2])
const SD = (d, c) => d.setDrawColor(c[0], c[1], c[2])
const ST = (d, c) => d.setTextColor(c[0], c[1], c[2])
const FN = (d, s, z) => { d.setFont('helvetica', s); d.setFontSize(z) }

const fDH = n => n != null
  ? Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' DH'
  : '—'

const STATUT_COLORS = { impayee: 'error', payee: 'success', annulee: 'default' }
const STATUT_LABELS = { impayee: 'Impayée', payee: 'Payée', annulee: 'Annulée' }

// ─── Montant en lettres ───────────────────────────────────────────────────────
function enLettres(nb) {
  nb = Math.round(nb * 100) / 100
  const ent = Math.floor(nb), dec = Math.round((nb - ent) * 100)
  const U = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
             'dix','onze','douze','treize','quatorze','quinze','seize',
             'dix-sept','dix-huit','dix-neuf']
  const D = ['','','vingt','trente','quarante','cinquante','soixante',
             'soixante-dix','quatre-vingt','quatre-vingt-dix']
  function g(n) {
    if (!n) return ''
    let r = ''
    if (n >= 100) { const c = Math.floor(n/100); r += (c===1?'cent':U[c]+' cent')+' '; n %= 100 }
    if (n >= 20)  { const dz = Math.floor(n/10), u = n%10; r += D[dz]; if (u) r += '-'+U[u] }
    else if (n)   r += U[n]
    return r.trim()
  }
  let r = '', n = ent
  if (n >= 1e6) { const m = Math.floor(n/1e6); r += (m===1?'un million':g(m)+' millions')+' '; n %= 1e6 }
  if (n >= 1000) { const k = Math.floor(n/1000); r += (k===1?'mille':g(k)+' mille')+' '; n %= 1000 }
  if (n > 0) r += g(n)+' '
  if (!r.trim()) r = 'zéro '
  r = r.trim()[0].toUpperCase() + r.trim().slice(1) + ' dirhams'
  if (dec > 0) r += ' et ' + String(dec).padStart(2,'0') + ' centimes'
  return r + ' TTC'
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GÉNÉRATION PDF  —  style identique BCF
// ═══════════════════════════════════════════════════════════════════════════════
async function genererPDF(ff, entreprise) {
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210, PH = 297, ML = 10, MR = 10

  // ── Logo ──────────────────────────────────────────────────────────────────
  let logoB64 = null
  const logoField = entreprise?.logo
  if (logoField) {
    try {
      const path = logoField.startsWith('/') ? logoField : `/uploads/logos/${logoField}`
      const url  = path.startsWith('http') ? path : `${API_BASE}${path}`
      const resp = await fetch(url, { credentials: 'include' })
      if (resp.ok) {
        const blob = await resp.blob()
        logoB64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload  = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    } catch { logoB64 = null }
  }

  // ── Données fournisseur (complètes) ───────────────────────────────────────
  const fNom   = ff.fournisseurNom       || ''
  const fTel   = ff.fournisseurTelephone || ''
  const fEmail = ff.fournisseurEmail     || ''
  const fAdr   = ff.fournisseurAdresse   || ''
  const fIce   = ff.fournisseurIce       || ''

  const affaire    = ff.affaireNom        || '-'
  const dateF      = ff.dateFacture  ? dayjs(ff.dateFacture).format('DD/MM/YYYY')  : '—'
  const dateE      = ff.dateEcheance ? dayjs(ff.dateEcheance).format('DD/MM/YYYY') : 'Non définie'
  const brRef      = ff.bonReceptionFournisseurNumero
                  || (ff.bonReceptionFournisseurId ? `BR #${ff.bonReceptionFournisseurId}` : '—')
  const ht         = Number(ff.montantHt  || 0)
  const tva        = Number(ff.tva        || ht * 0.20)
  const ttc        = Number(ff.montantTtc || ht + tva)
  const lignes     = ff.details || []

  const BLIMIT = PH - 30
  const TOP    = 45

  // ── Calcul hauteur cadres ─────────────────────────────────────────────────
  function calcH(ls) {
    let h = 8
    ls.forEach(l => { if (l) h += l.length > 100 ? Math.ceil(l.length / 50) * 4 : 4 })
    return Math.max(h + 4, 30)
  }

  const hE = calcH([
    entreprise?.nom, entreprise?.responsable,
    entreprise?.telephone, entreprise?.email, entreprise?.ice,
  ].filter(Boolean))

  // Cadre fournisseur avec toutes les infos
  const hF = calcH([
    fNom,
    fTel   ? 'Tél: '    + fTel   : null,
    fEmail ? 'E-mail: ' + fEmail : null,
    fAdr   ? 'Adr: '    + fAdr   : null,
    fIce   ? 'ICE: '    + fIce   : 'ICE: Non renseigné',
  ].filter(Boolean))

  const hBandeau = Math.max(hE, hF, 30)
  const CW = 90

  // ── HEADER (logo) ─────────────────────────────────────────────────────────
  function drawHeader() {
    SF(doc, BLANC); SD(doc, BLANC); doc.setLineWidth(0.1)
    doc.rect(0, 0, PW, 35, 'F')
    if (logoB64) {
      const imgType = logoB64.startsWith('data:image/jpeg') ? 'JPEG'
                    : logoB64.startsWith('data:image/webp') ? 'WEBP' : 'PNG'
      doc.addImage(logoB64, imgType, 10, 5, 42, 27)
    } else {
      SF(doc, BLEU_FONCE); SD(doc, BLEU_FONCE); doc.setLineWidth(0)
      doc.circle(25, 17, 12, 'F')
      SF(doc, BLANC); doc.circle(25, 17, 9, 'F')
      FN(doc, 'bold', 8); ST(doc, BLEU_FONCE)
      const ini = (entreprise?.nom || 'FF').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
      doc.text(ini, 25, 19, { align: 'center' })
    }
  }

  // ── BANDEAU INFO — répété sur chaque page ────────────────────────────────
  function drawInfoBandeau(startY) {
    const h = hBandeau

    // Cadre Entreprise (gauche) — bleu
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(ML, startY, CW, h, 3, 3, 'FD')
    FN(doc, 'bold', 11); ST(doc, BLEU_GMT)
    doc.text(entreprise?.nom || '', ML + 3, startY + 7)
    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yi = startY + 13
    if (entreprise?.responsable) { doc.text('Resp: '   + entreprise.responsable, ML + 3, yi); yi += 4 }
    if (entreprise?.telephone)   { doc.text('Tél: '    + entreprise.telephone,   ML + 3, yi); yi += 4 }
    if (entreprise?.email)       { doc.text('E-mail: ' + entreprise.email,       ML + 3, yi); yi += 4 }
    if (entreprise?.ice)         { FN(doc, 'bold', 8); ST(doc, NOIR); doc.text('ICE: ' + entreprise.ice, ML + 3, yi) }

    // Cadre Fournisseur (droite) — orange + infos complètes
    SF(doc, BLANC); SD(doc, ORANGE_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(110, startY, CW, h, 3, 3, 'FD')
    FN(doc, 'bold', 11); ST(doc, ORANGE_GMT)
    doc.text(fNom, 113, startY + 7)
    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yj = startY + 13
    if (fTel)   { doc.text('Tél: ' + fTel, 113, yj); yj += 4 }
    if (fEmail) { doc.text('E-mail: ' + fEmail, 113, yj); yj += 4 }
    if (fAdr) {
      FN(doc, 'normal', 7.5)
      const adrLines = doc.splitTextToSize('Adresse: ' + fAdr, 84)
      adrLines.forEach(l => { if (yj < startY + h - 4) { doc.text(l, 113, yj); yj += 3.5 } })
      FN(doc, 'normal', 8)
    }
    if (yj < startY + h - 2) {
      FN(doc, 'bold', 8); ST(doc, NOIR)
      doc.text(fIce ? 'ICE: ' + fIce : 'ICE: Non renseigné', 113, yj)
    }

    return startY + h + 5
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  function drawFooter(pNum, pTot) {
    const yB = PH - 25
    SD(doc, BLEU_GMT); doc.setLineWidth(0.3)
    doc.line(ML, yB, PW - MR, yB)
    if (entreprise?.nom) {
      FN(doc, 'bold', 10); ST(doc, ORANGE_GMT)
      const tw = doc.getTextWidth(entreprise.nom)
      const tx = (PW - tw) / 2
      SF(doc, BLANC); SD(doc, BLANC); doc.setLineWidth(0)
      doc.rect(tx - 2, yB - 3.5, tw + 4, 6, 'F')
      ST(doc, ORANGE_GMT)
      doc.text(entreprise.nom, tx, yB + 0.5)
    }
    const P = []
    if (entreprise?.adresse)   P.push('Adresse : '  + entreprise.adresse)
    if (entreprise?.telephone) P.push('Tél : '      + entreprise.telephone)
    if (entreprise?.fax)       P.push('Fax : '      + entreprise.fax)
    const sw = entreprise?.siteWeb || entreprise?.site_web
    if (sw)                    P.push('Site Web : ' + sw)
    if (entreprise?.email)     P.push('E-mail : '   + entreprise.email)
    if (entreprise?.ifiscale)  P.push('I.F. : '     + entreprise.ifiscale)
    if (entreprise?.cnss)      P.push('CNSS : '     + entreprise.cnss)
    if (entreprise?.patente)   P.push('Patente : '  + entreprise.patente)
    if (entreprise?.rc)        P.push('R.C. : '     + entreprise.rc)
    if (entreprise?.ice)       P.push('ICE : '      + entreprise.ice)
    const cb = entreprise?.compteBancaire || entreprise?.compte_bancaire
    if (cb)                    P.push('C.B. : ' + cb)
    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.splitTextToSize(P.join(' | '), PW - 20).forEach((l, i) =>
      doc.text(l, PW / 2, yB + 7 + i * 3.5, { align: 'center' }))
    if (pTot > 1) {
      const pt  = `Page ${pNum} sur ${pTot}`
      const pw2 = doc.getTextWidth(pt)
      SF(doc, BLANC); SD(doc, BLANC); doc.setLineWidth(0)
      doc.rect(PW - MR - pw2 - 6, yB - 3.5, pw2 + 4, 6, 'F')
      FN(doc, 'normal', 8); ST(doc, NOIR)
      doc.text(pt, PW - MR - pw2 - 4, yB + 0.5)
    }
  }

  // checkNewPage avec bandeau répété ─────────────────────────────────────────
  function checkNewPage(needed = 10) {
    if (y + needed > BLIMIT) {
      doc.addPage()
      drawHeader()
      y = drawInfoBandeau(TOP)
    }
  }

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  drawHeader()
  let y = drawInfoBandeau(TOP)

  // Titre
  FN(doc, 'bold', 14); ST(doc, NOIR)
  doc.text('FACTURE FOURNISSEUR : ' + (ff.numero || ''), ML, y + 8)
  y += 14

  // Tableau infos 5 colonnes
  const CL = 38, RH = 8
  ;['Affaire', 'Date facture', 'BR lié', 'Échéance', 'Net à payer'].forEach((h, i) => {
    SF(doc, BLEU_CLAIR_BG); SD(doc, BLEU_GMT); doc.setLineWidth(0.2)
    doc.rect(ML + i * CL, y, CL, RH, 'FD')
    FN(doc, 'bold', 8); ST(doc, NOIR)
    doc.text(h, ML + i * CL + CL / 2, y + 5.5, { align: 'center' })
  })
  y += RH

  const infoY = y
  ;[affaire, dateF, brRef, dateE, fDH(ttc)].forEach((v, i) => {
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.2)
    doc.rect(ML + i * CL, infoY, CL, RH, 'FD')
    FN(doc, 'normal', 8); ST(doc, NOIR)
    const lines2 = doc.splitTextToSize(v, CL - 4)
    doc.text(lines2[0] || '', ML + i * CL + CL / 2, infoY + 5.5, { align: 'center' })
  })
  y += RH + 5

  // ── Tableau articles ──────────────────────────────────────────────────────
  const AC = [15, 85, 15, 20, 25, 30]
  const AH = ['N°', 'Désignation', 'Unité', 'Quantité', 'P.U. (DH)', 'P.T. (DH)']
  const DESIG_FONT_SIZE = 6.5
  const DESIG_LINE_H    = 3.2
  const DESIG_MIN_ROW_H = 6

  function drawArtHeader(yy) {
    let xi = ML
    AC.forEach((w, i) => {
      SF(doc, BLANC); SD(doc, BLEU_FONCE); doc.setLineWidth(0.3)
      doc.rect(xi, yy, w, 8, 'FD')
      FN(doc, 'bold', 9); ST(doc, NOIR)
      doc.text(AH[i], xi + w / 2, yy + 5.5, { align: 'center' })
      xi += w
    })
    return yy + 8
  }

  if (lignes.length > 0) {
    checkNewPage(20)
    y = drawArtHeader(y)

    let lineNum = 1
    lignes.forEach(ligne => {
      const desig = ligne.articleDesignation || ligne.designation || ''
      const unite = ligne.articleUnite || ligne.unite || '—'
      const qte   = Number(ligne.qte || 0)
      const pu    = Number(ligne.prixUnitaire || 0)
      const pt    = Number(ligne.montant || qte * pu)

      doc.setFontSize(DESIG_FONT_SIZE)
      const dLines = doc.splitTextToSize(desig, 83)
      const lH     = Math.max(DESIG_MIN_ROW_H, dLines.length * DESIG_LINE_H + 2)

      if (y + lH > BLIMIT) {
        doc.addPage(); drawHeader()
        y = drawInfoBandeau(TOP)
        y = drawArtHeader(y)
      }

      const sy = y; let xi = ML

      SF(doc, BLANC); SD(doc, BLEU_FONCE); doc.setLineWidth(0.3)
      doc.rect(xi, sy, AC[0], lH, 'FD')
      FN(doc, 'normal', 8); ST(doc, NOIR)
      doc.text(String(lineNum), xi + AC[0] / 2, sy + lH / 2 + 1, { align: 'center' })
      xi += AC[0]

      SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.3)
      doc.rect(xi, sy, AC[1], lH, 'FD')
      FN(doc, 'normal', DESIG_FONT_SIZE); ST(doc, NOIR)
      dLines.forEach((dl, di) => doc.text(dl, xi + 1, sy + 2.5 + di * DESIG_LINE_H))
      xi += AC[1]

      ;[[AC[2], unite,                                                          'center'],
        [AC[3], qte.toLocaleString('fr-MA', { minimumFractionDigits: 2 }),     'center'],
        [AC[4], pu.toLocaleString ('fr-MA', { minimumFractionDigits: 2 }),     'right' ],
        [AC[5], pt.toLocaleString ('fr-MA', { minimumFractionDigits: 2 }),     'right' ],
      ].forEach(([w, v, al]) => {
        SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.3)
        doc.rect(xi, sy, w, lH, 'FD')
        FN(doc, 'normal', 8); ST(doc, NOIR)
        doc.text(v, al === 'right' ? xi + w - 1 : xi + w / 2, sy + lH / 2 + 1, { align: al })
        xi += w
      })
      y += lH
      lineNum++
    })

    // Totaux
    checkNewPage(22)
    y += 2

    FN(doc, 'bold', 9); ST(doc, BLEU_GMT)
    doc.text('Arrêté la présente facture à la somme de :', ML, y + 4.5)
    FN(doc, 'italic', 7); ST(doc, NOIR)
    doc.splitTextToSize(enLettres(ttc), 95).forEach((l, i) => doc.text(l, ML, y + 10 + i * 3.5))

    const TX = ML + 100
    const TW = PW - TX - MR
    const LW = TW * 0.6
    const VW = TW * 0.4

    // HT — orange
    SF(doc, ORANGE_CLAIR); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, NOIR)
    doc.text('Montant Total H.T (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(ht), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 8

    // TVA — orange
    SF(doc, ORANGE_CLAIR); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, NOIR)
    doc.text('Montant Total TVA (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(tva), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 8

    // TTC — fond orange
    SF(doc, ORANGE_GMT); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, BLANC)
    doc.text('Montant Total TTC (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(ttc), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 14
  }

  // ── Zone de signature ─────────────────────────────────────────────────────
  checkNewPage(40)
  y += 4
  const SW = 80, SH = 30, SY = y
  ;[
    { label: 'Bon pour accord — Fournisseur', x: ML },
    { label: 'Cachet et signature de la société', x: PW - MR - SW },
  ].forEach(({ label, x }) => {
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.3)
    doc.roundedRect(x, SY, SW, SH, 2, 2, 'FD')
    FN(doc, 'bold', 8); ST(doc, BLEU_GMT)
    doc.text(label, x + SW / 2, SY + 5, { align: 'center' })
    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.text('Signature & cachet : _______________', x + SW / 2, SY + SH - 5, { align: 'center' })
  })
  y += SH + 6

  // ── Observations ──────────────────────────────────────────────────────────
  const obs = ff.observations || ''
  if (obs) {
    checkNewPage(15)
    FN(doc, 'bold', 9); ST(doc, VERT_GMT)
    doc.text('Observations :', ML, y + 4); y += 6
    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.splitTextToSize(obs, PW - ML - MR).forEach(l => {
      checkNewPage(5); doc.text(l, ML, y + 3); y += 3.5
    })
  }

  // ── Footers ───────────────────────────────────────────────────────────────
  const tot = doc.getNumberOfPages()
  for (let p = 1; p <= tot; p++) { doc.setPage(p); drawFooter(p, tot) }

  doc.save(`FF_${ff.numero || 'XXX'}_${dayjs().format('YYYYMMDD')}.pdf`)
}
export default function FactureFournisseurView() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [ff,         setFf]         = useState(null)
  const [entreprise, setEntreprise] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [pdfLoad,    setPdfLoad]    = useState(false)

  const resolveLogoUrl = (path) => {
    if (!path) return null
    return path.startsWith('http') ? path : `${API_BASE}${path}`
  }

  useEffect(() => {
    const run = async () => {
      try {
        const d = await factureFournisseurService.getById(id)
        setFf(d)
        try {
          let e = null
          if (typeof entrepriseService?.getCurrent === 'function')
            e = await entrepriseService.getCurrent()
          else if (typeof entrepriseService?.getAll === 'function') {
            const pg = await entrepriseService.getAll({ page: 0, size: 1 })
            e = pg?.content?.[0] ?? (Array.isArray(pg) ? pg[0] : pg)
          }
          setEntreprise(e)
        } catch (_) {}
      } catch {
        toast.error('Facture fournisseur introuvable')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const handleStatut = async (statut) => {
    try {
      setFf(await factureFournisseurService.updateStatut(id, statut))
      toast.success('Statut mis à jour')
    } catch { toast.error('Erreur') }
  }

  const handlePdf = async () => {
    setPdfLoad(true)
    try { await genererPDF(ff, entreprise) }
    catch (e) { console.error('PDF error:', e); toast.error('Erreur génération PDF') }
    finally { setPdfLoad(false) }
  }

  if (loading) return <Typography p={4}>Chargement…</Typography>
  if (!ff)     return <Typography p={4} color="error">Facture fournisseur introuvable</Typography>

  const ht       = Number(ff.montantHt  || 0)
  const tva      = Number(ff.tva        || ht * 0.20)
  const totalTtc = Number(ff.montantTtc || ht + tva)
  const logoUrl  = resolveLogoUrl(entreprise?.logo)
  const statut   = ff.statut || 'impayee'
  const canEdit  = statut !== 'annulee' && statut !== 'payee'
  const isRetard = ff.dateEcheance && dayjs(ff.dateEcheance).isBefore(dayjs()) && statut === 'impayee'

  return (
    <Box>
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Box
        mb={2.5}
        sx={{
          bgcolor: 'white',
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          px: 2,
          py: 1.5,
        }}
      >
        {/* Ligne 1 : retour + logo + titre  |  statut à droite */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.2}
        >
          {/* Gauche */}
          <Stack direction="row" alignItems="center" gap={1.5}>
            <IconButton
              onClick={() => navigate('/factures-fournisseur')} size="small"
              sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: BG_PAGE, color: BLUE_DD, flexShrink: 0, '&:hover': { bgcolor: '#dbeafe' } }}
            >
              <ArrowBack sx={{ fontSize: 16 }} />
            </IconButton>

            {logoUrl ? (
              <Box component="img" src={logoUrl} alt="logo"
                sx={{ height: 32, maxWidth: 90, objectFit: 'contain', borderRadius: 1, flexShrink: 0 }} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: BG_PAGE, color: VERT_CSS, fontWeight: 700, fontSize: 13, border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                {(entreprise?.nom || '?').charAt(0)}
              </Avatar>
            )}

            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
                FF {ff.numero}
              </Typography>
              {entreprise?.nom && (
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500 }}>
                  {entreprise.nom}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Droite : statut */}
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip
              label={STATUT_LABELS[statut] || statut}
              color={STATUT_COLORS[statut] || 'default'}
              size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />
            {ff.bonReceptionFournisseurId && (
              <Chip
                label={`BR ${ff.bonReceptionFournisseurNumero || '#' + ff.bonReceptionFournisseurId}`}
                size="small" variant="outlined"
                onClick={() => navigate(`/receptions-fournisseur/${ff.bonReceptionFournisseurId}`)}
                sx={{ fontSize: '0.7rem', fontWeight: 600, borderColor: BLUE, color: BLUE, cursor: 'pointer', '&:hover': { bgcolor: BG_PAGE } }}
              />
            )}
            {isRetard && (
              <Chip
                label="En retard" size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: '#FEF2F2', color: ROUGE_CSS, border: `1px solid ${ROUGE_CSS}40` }}
              />
            )}
          </Stack>
        </Stack>

        {/* Ligne 2 : boutons d'action */}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {statut === 'impayee' && (
            <Button size="small" onClick={() => handleStatut('payee')}
              sx={{ border: `1px solid ${VERT_CSS}50`, color: VERT_F, borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7, '&:hover': { bgcolor: VERT_BG, borderColor: VERT_CSS } }}>
              Marquer payée
            </Button>
          )}
          {statut === 'impayee' && (
            <Button size="small" onClick={() => handleStatut('annulee')}
              sx={{ border: `1px solid ${ROUGE_CSS}50`, color: ROUGE_CSS, borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7, '&:hover': { bgcolor: '#FEF2F2', borderColor: ROUGE_CSS } }}>
              Annuler
            </Button>
          )}
          <Button size="small"
            startIcon={<PictureAsPdf sx={{ fontSize: '15px !important' }} />}
            onClick={handlePdf} disabled={pdfLoad}
            sx={{ border: `1px solid ${VERT_CSS}50`, color: VERT_CSS, borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7, '&:hover': { bgcolor: VERT_BG, borderColor: VERT_CSS }, '&.Mui-disabled': { opacity: 0.5 } }}>
            {pdfLoad ? 'Génération…' : 'PDF'}
          </Button>
          {canEdit && (
            <Button size="small"
              startIcon={<Edit sx={{ fontSize: '15px !important' }} />}
              onClick={() => navigate(`/factures-fournisseur/${id}/modifier`)}
              sx={{ bgcolor: VERT_CSS, color: 'white', borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7, boxShadow: `0 4px 12px ${VERT_CSS}30`, '&:hover': { bgcolor: VERT_F } }}>
              Modifier
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── CONTENU ───────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>

        {/* Colonne principale */}
        <Grid item xs={12} md={8}>
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>

            {/* Bande titre */}
            <Box sx={{ bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`, px: 2.5, py: 1.1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT_S }}>
                FACTURE FOURNISSEUR : {ff.numero}
              </Typography>
              {ff.affaireNom && (
                <Typography sx={{ fontSize: '0.72rem', color: TEXT_M }}>Affaire : {ff.affaireNom}</Typography>
              )}
            </Box>

            {/* Cartes émetteur / fournisseur */}
            <Box sx={{ bgcolor: BG_PAGE, px: 2.5, py: 2 }}>
              <Grid container spacing={2}>

                {/* Émetteur */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: `1px solid ${BLUE}30`, borderRadius: 2, bgcolor: 'white', p: 2, height: '100%' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                      Émetteur
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={1} mb={1}>
                      {logoUrl && <Box component="img" src={logoUrl} alt="logo" sx={{ height: 24, maxWidth: 60, objectFit: 'contain' }} />}
                      <Typography sx={{ fontWeight: 800, color: BLUE_DD, fontSize: '0.9rem' }}>{entreprise?.nom || '—'}</Typography>
                    </Stack>
                    {entreprise?.telephone && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Tél : {entreprise.telephone}</Typography>}
                    {entreprise?.email     && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Email : {entreprise.email}</Typography>}
                    {entreprise?.ice       && <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, mt: 0.5 }}>ICE : {entreprise.ice}</Typography>}
                  </Box>
                </Grid>

                {/* Fournisseur */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: `1px solid ${VERT_CSS}50`, borderRadius: 2, bgcolor: VERT_BG, p: 2, height: '100%' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: VERT_CSS, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                      Fournisseur
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: VERT_F, fontSize: '1rem', mb: 1 }}>{ff.fournisseurNom}</Typography>
                    {ff.fournisseurTelephone && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Tél : {ff.fournisseurTelephone}</Typography>}
                    {ff.fournisseurEmail     && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Email : {ff.fournisseurEmail}</Typography>}
                    {ff.fournisseurAdresse   && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Adresse : {ff.fournisseurAdresse}</Typography>}
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, mt: 0.5 }}>
                      ICE : {ff.fournisseurIce || 'Non renseigné'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Dates & infos */}
                {[
                  { label: 'Date facture', val: ff.dateFacture  ? dayjs(ff.dateFacture).format('DD/MM/YYYY')  : '—' },
                  { label: 'Échéance',     val: ff.dateEcheance ? dayjs(ff.dateEcheance).format('DD/MM/YYYY') : '—', highlight: isRetard },
                  { label: 'BR lié',       val: ff.bonReceptionFournisseurNumero || (ff.bonReceptionFournisseurId ? `#${ff.bonReceptionFournisseurId}` : '—') },
                  { label: 'Affaire',      val: ff.affaireNom || '—' },
                ].map(({ label, val, highlight }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: highlight ? ROUGE_CSS : BLUE_DD }}>{val}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Tableau articles */}
            <Box sx={{ px: 1.5, pt: 1, overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    {[
                      { label: 'Code',        align: 'left'  },
                      { label: 'Désignation', align: 'left'  },
                      { label: 'Unité',       align: 'left'  },
                      { label: 'Qté',         align: 'right' },
                      { label: 'P.U. HT',     align: 'right' },
                      { label: 'Montant HT',  align: 'right' },
                    ].map(({ label, align }) => (
                      <TableCell key={label} align={align} sx={{ fontSize: '0.65rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `2px solid ${BORDER}`, py: 1, whiteSpace: 'nowrap' }}>
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ff.details?.map((d, i) => (
                    <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? 'white' : SURFACE3, '&:hover': { bgcolor: VERT_BG } }}>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_M, whiteSpace: 'nowrap' }}>{d.articleCode}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{d.articleDesignation}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.articleUnite || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.qte}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {Number(d.prixUnitaire).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: VERT_CSS, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {Number(d.montant).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Totaux */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, px: 2.5, py: 2 }}>
              <Stack alignItems="flex-end" gap={0}>
                {[
                  { label: 'Total HT',  val: `${ht.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH`,       bg: 'white',  border: `1px solid ${BORDER}`, color: BLUE_DD },
                  { label: 'TVA 20 %',  val: `${tva.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH`,      bg: 'white',  border: `1px solid ${BORDER}`, color: TEXT_M  },
                  { label: 'Total TTC', val: `${totalTtc.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH`, bg: VERT_CSS,   border: 'none',                color: 'white' },
                ].map(({ label, val, bg, border, color }, idx) => (
                  <Box key={label} sx={{
                    width: { xs: '100%', sm: 280 },
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    bgcolor: bg, border, borderTop: idx === 0 ? border : 'none',
                    borderRadius: idx === 2 ? '0 0 8px 8px' : 0, px: 2, py: 0.8,
                  }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Zone signatures */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, px: 2.5, py: 2 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Bon pour accord — Fournisseur',    color: VERT_CSS, bg: VERT_BG },
                  { label: 'Cachet et signature de la société', color: BLUE,  bg: BG_PAGE   },
                ].map(({ label, color, bg }) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Box sx={{ border: `1px dashed ${color}50`, borderRadius: 2, p: 2, minHeight: 80, bgcolor: bg }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {label}
                      </Typography>
                      <Box mt={2} sx={{ height: 40 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Observations */}
            {ff.observations && (
              <Box px={2.5} pb={2}>
                <Divider sx={{ mb: 1.5, borderColor: BORDER }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: VERT_CSS, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Observations
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_M, whiteSpace: 'pre-wrap' }}>
                  {ff.observations}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>

          {/* Informations */}
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`, px: 2.5, py: 1.1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT_S }}>
                Informations
              </Typography>
            </Box>
            <Stack gap={1.5} p={2} direction={{ xs: 'row', md: 'column' }} flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Numéro</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: VERT_CSS }}>{ff.numero}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Statut</Typography>
                <Box mt={0.3}>
                  <Chip label={STATUT_LABELS[statut] || statut} color={STATUT_COLORS[statut] || 'default'} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                </Box>
              </Box>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Créé le</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: BLUE_DD }}>
                  {ff.dateCreation ? dayjs(ff.dateCreation).format('DD/MM/YYYY HH:mm') : '—'}
                </Typography>
              </Box>
              {ff.dateFacture && (
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Date facture</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD }}>
                    {dayjs(ff.dateFacture).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              )}
              {ff.dateEcheance && (
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Échéance</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: isRetard ? ROUGE_CSS : BLUE_DD }}>
                    {dayjs(ff.dateEcheance).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Total TTC</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: VERT_CSS }}>
                  {totalTtc.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
                </Typography>
              </Box>
              {ff.bonReceptionFournisseurId && (
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>BR d'origine</Typography>
                  <Button size="small"
                    onClick={() => navigate(`/receptions-fournisseur/${ff.bonReceptionFournisseurId}`)}
                    sx={{ display: 'block', mt: 0.5, textTransform: 'none', border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.5, '&:hover': { bgcolor: BG_PAGE } }}>
                    Voir BR {ff.bonReceptionFournisseurNumero || `#${ff.bonReceptionFournisseurId}`}
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Chaîne documentaire */}
          <Box sx={{ bgcolor: 'white', border: `1px solid ${VERT_CSS}40`, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: VERT_BG, borderBottom: `1px solid ${VERT_CSS}40`, px: 2.5, py: 1.1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: VERT_CSS }}>
                Chaîne documentaire
              </Typography>
            </Box>
            <Box p={2}>
              <Typography sx={{ fontSize: '0.78rem', color: TEXT_M, lineHeight: 1.9 }}>
                BCF → Bon de Commande Fournisseur<br />
                BRF → Bon de Réception Fournisseur<br />
                <strong>FF → Facture Fournisseur (ici)</strong><br />
                <br />
                Générée depuis un BR fournisseur.<br />
                Statut : <strong>{STATUT_LABELS[statut] || statut}</strong>
              </Typography>
            </Box>
          </Box>

        </Grid>
      </Grid>
    </Box>
  )
}