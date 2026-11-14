import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Grid, Stack, Button, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Avatar
} from '@mui/material'
import { ArrowBack, Edit, PictureAsPdf, LocalShipping } from '@mui/icons-material'
import bonLivraisonService from '../../../services/bonLivraisonService'
import entrepriseService   from '../../../services/entrepriseService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Palette ─────────────────────────────────────────────────────────────────
const BLUE    = '#1A6FE8'
const BLUE_D  = '#1558B0'
const BLUE_DD = '#0E3D9C'
const ORANGE  = '#F59E0B'
const ORANGE_LIGHT = '#fde68a'
const BG_PAGE = '#EEF2FB'
const BORDER  = '#e2e8f0'
const TEXT_M  = '#64748b'
const TEXT_S  = '#94a3b8'
const SURFACE2 = '#f1f5f9'
const SURFACE3 = '#fafbfe'
const ORANGE_BG = '#FFFBEB'

// ─── Couleurs jsPDF (RGB) ─────────────────────────────────────────────────────
const BLEU_GMT      = [0,   102, 204]
const BLEU_FONCE    = [0,   51,  102]
const ORANGE_GMT    = [255, 165, 0  ]
const ORANGE_CLAIR  = [255, 248, 230]
const BLEU_CLAIR_BG = [230, 242, 255]
const BLANC         = [255, 255, 255]
const NOIR          = [0,   0,   0  ]
const BLEU_DECO     = [173, 216, 230]
const VERT_GMT      = [22,  163,  74]
const ROUGE_GMT     = [220,  38,  38]

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const SF = (d, c) => d.setFillColor(c[0], c[1], c[2])
const SD = (d, c) => d.setDrawColor(c[0], c[1], c[2])
const ST = (d, c) => d.setTextColor(c[0], c[1], c[2])
const FN = (d, s, z) => { d.setFont('helvetica', s); d.setFontSize(z) }

const fDH = n => n != null
  ? Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' DH'
  : '—'

const STATUT_COLORS = {
  en_cours : 'warning',
  livre    : 'success',
  annule   : 'error',
}
const STATUT_LABELS = {
  en_cours : 'En cours',
  livre    : 'Livré',
  annule   : 'Annulé',
}

// ─── Montant en lettres FR ────────────────────────────────────────────────────
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
//  GÉNÉRATION PDF BON DE LIVRAISON
// ═══════════════════════════════════════════════════════════════════════════════
async function genererPDF(bl, entreprise) {
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

  const BLIMIT = PH - 30
  const TOP    = 45

  // ── Données client — résolution multi-champs ──────────────────────────────
  const cNom   = bl.clientNom       || bl.nomClient       || bl.client?.nom        || ''
  const cTel   = bl.clientTelephone || bl.clientPhone      || bl.telephone          ||
                 bl.client?.telephone || bl.client?.phone  || ''
  const cEmail = bl.clientEmail     || bl.emailClient      || bl.email              ||
                 bl.client?.email   || ''
  const cAdr   = bl.clientAdresse   || bl.adresseClient    || bl.adresse            ||
                 bl.clientAddress   || bl.client?.adresse  || bl.client?.address   || ''
  const cIce   = bl.clientIce       || bl.iceClient        || bl.ice                ||
                 bl.client?.ice     || ''

  const affaire = bl.affaireNom    || bl.affaire?.nom || '-'
  const dateLiv = bl.dateLivraison ? dayjs(bl.dateLivraison).format('DD/MM/YYYY') : '—'
  const bccRef  = bl.bonCommandeClientId ? `BCC #${bl.bonCommandeClientId}` : '—'
  const numCmd  = bl.bonCommandeClientNumero || bl.bccNumero || bl.bonCommandeNumero || (bl.bonCommandeClientId ? `CMD-${bl.bonCommandeClientId}` : '-')
  const ht      = Number(bl.montantHt  || 0)
  const tva     = Number(bl.tva        || 0)
  const ttc     = Number(bl.montantTtc || 0)
  const lignes  = bl.details || []

  // ── Calcul hauteur des cadres ─────────────────────────────────────────────
  function calcH(ls) {
    let h = 8
    ls.forEach(l => { if (l) h += l.length > 100 ? Math.ceil(l.length / 50) * 4 : 4 })
    return Math.max(h + 4, 30)
  }

  const entrepriseLines = [
    entreprise?.nom,
    entreprise?.responsable ? 'Resp: ' + entreprise.responsable : null,
    entreprise?.telephone   ? 'Tél: '  + entreprise.telephone   : null,
    entreprise?.email       ? 'E-mail: '+ entreprise.email      : null,
    entreprise?.ice         ? 'ICE: '  + entreprise.ice         : null,
  ].filter(Boolean)

  const clientLines = [
    cNom,
    cTel   ? 'Tél: '     + cTel   : null,
    cEmail ? 'E-mail: '  + cEmail  : null,
    cAdr   ? 'Adresse: ' + cAdr   : null,
    'ICE: ' + (cIce || 'Non renseigné'),
  ].filter(Boolean)

  const hE       = calcH(entrepriseLines)
  const hC       = calcH(clientLines)
  const hBandeau = Math.max(hE, hC, 30)
  const CW       = 90

  // ── HEADER (logo — répété sur chaque page) ────────────────────────────────
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
      const ini = (entreprise?.nom || 'BL').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
      doc.text(ini, 25, 19, { align: 'center' })
    }
   
  }

  // ── BANDEAU INFOS SOCIÉTÉ + CLIENT (répété sur chaque page) ──────────────
  function drawInfoBandeau(startY) {
    const h = hBandeau

    // Cadre Société (gauche, bleu)
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(ML, startY, CW, h, 3, 3, 'FD')
    FN(doc, 'bold', 11); ST(doc, BLEU_GMT)
    doc.text(entreprise?.nom || '', ML + 3, startY + 7)
    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yi = startY + 13
    if (entreprise?.responsable) { doc.text('Resp: '   + entreprise.responsable, ML + 3, yi); yi += 4 }
    if (entreprise?.telephone)   { doc.text('Tél: '    + entreprise.telephone,   ML + 3, yi); yi += 4 }
    if (entreprise?.email)       { doc.text('E-mail: ' + entreprise.email,        ML + 3, yi); yi += 4 }
    if (entreprise?.ice)         { FN(doc, 'bold', 8); ST(doc, NOIR); doc.text('ICE: ' + entreprise.ice, ML + 3, yi) }

    // Cadre Client livré (droite, orange) — toutes les infos
    SF(doc, BLANC); SD(doc, ORANGE_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(110, startY, CW, h, 3, 3, 'FD')

    // Nom client en titre
    FN(doc, 'bold', 11); ST(doc, ORANGE_GMT)
    const nomLines = doc.splitTextToSize(cNom, CW - 6)
    nomLines.forEach((l, i) => doc.text(l, 113, startY + 7 + i * 4.5))

    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yj = startY + 7 + nomLines.length * 4.5 + 2

    // Téléphone
    if (cTel && yj < startY + h - 4) {
      doc.text('Tél: ' + cTel, 113, yj)
      yj += 4
    }

    // Email (avec retour à la ligne si trop long)
    if (cEmail && yj < startY + h - 4) {
      FN(doc, 'normal', 7.5)
      const emailLines = doc.splitTextToSize('E-mail: ' + cEmail, CW - 6)
      emailLines.forEach(l => {
        if (yj < startY + h - 4) { doc.text(l, 113, yj); yj += 3.8 }
      })
      FN(doc, 'normal', 8)
    }

    // Adresse (avec retour à la ligne si trop longue)
    if (cAdr && yj < startY + h - 4) {
      FN(doc, 'normal', 7.5)
      const adrLines = doc.splitTextToSize('Adresse: ' + cAdr, CW - 6)
      adrLines.forEach(l => {
        if (yj < startY + h - 4) { doc.text(l, 113, yj); yj += 3.8 }
      })
      FN(doc, 'normal', 8)
    }

    // ICE (toujours en gras en bas)
    if (yj < startY + h - 1) {
      FN(doc, 'bold', 8); ST(doc, NOIR)
      doc.text(cIce ? 'ICE: ' + cIce : 'ICE: Non renseigné', 113, yj)
    }

    return startY + h + 7
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
    if (entreprise?.adresse)   P.push('Adresse : ' + entreprise.adresse)
    if (entreprise?.telephone) P.push('Tél : '     + entreprise.telephone)
    if (entreprise?.fax)       P.push('Fax : '     + entreprise.fax)
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

  // ── checkNewPage — remet header + bandeau sur la nouvelle page ────────────
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

  // ── Titre BON DE LIVRAISON ────────────────────────────────────────────────
  FN(doc, 'bold', 14); ST(doc, NOIR)
  doc.text('BON DE LIVRAISON : ' + (bl.numero || ''), ML, y + 8)
  y += 14

  // ── Tableau infos (5 colonnes) ────────────────────────────────────────────
  const CL = 38, RH = 8
  ;['Affaire', 'Date livraison', 'BCC lié', 'N° Commande', 'Net à payer'].forEach((h, i) => {
    SF(doc, BLEU_CLAIR_BG); SD(doc, BLEU_GMT); doc.setLineWidth(0.2)
    doc.rect(ML + i * CL, y, CL, RH, 'FD')
    FN(doc, 'bold', 8); ST(doc, NOIR)
    doc.text(h, ML + i * CL + CL / 2, y + 5.5, { align: 'center' })
  })
  y += RH
   
  const infoY = y
  // APRÈS
;[affaire, dateLiv, bccRef, numCmd, fDH(ttc)].forEach((v, i) => {
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
      const unite = ligne.articleUnite       || ligne.unite       || '—'
      const qte   = Number(ligne.qte   || 0)
      const pu    = Number(ligne.prixUnitaire || 0)
      const pt    = Number(ligne.montant      || qte * pu)

      doc.setFontSize(DESIG_FONT_SIZE)
      const dLines = doc.splitTextToSize(desig, 83)
      const lH     = Math.max(DESIG_MIN_ROW_H, dLines.length * DESIG_LINE_H + 2)

      if (y + lH > BLIMIT) {
        doc.addPage()
        drawHeader()
        y = drawInfoBandeau(TOP)   // ← bandeau répété sur nouvelle page articles
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

      ;[[AC[2], unite,                                                     'center'],
        [AC[3], qte.toLocaleString('fr-MA', { minimumFractionDigits: 2 }), 'center'],
        [AC[4], pu.toLocaleString ('fr-MA', { minimumFractionDigits: 2 }), 'right' ],
        [AC[5], pt.toLocaleString ('fr-MA', { minimumFractionDigits: 2 }), 'right' ],
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

    // ── Totaux ───────────────────────────────────────────────────────────────
    checkNewPage(22)
    y += 2

    FN(doc, 'bold', 9); ST(doc, BLEU_GMT)
    doc.text('Arrêté le présent bon de livraison à la somme de :', ML, y + 4.5)
    FN(doc, 'italic', 7); ST(doc, NOIR)
    doc.splitTextToSize(enLettres(ttc), 95).forEach((l, i) => doc.text(l, ML, y + 10 + i * 3.5))

    const TX = ML + 100
    const TW = PW - TX - MR
    const LW = TW * 0.6
    const VW = TW * 0.4

    SF(doc, ORANGE_CLAIR); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, NOIR)
    doc.text('Montant Total H.T (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(ht), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 8

    SF(doc, ORANGE_CLAIR); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, NOIR)
    doc.text('Montant Total TVA (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(tva), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 8

    SF(doc, ORANGE_GMT); SD(doc, ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD'); doc.rect(TX + LW, y, VW, 8, 'FD')
    FN(doc, 'bold', 9); ST(doc, BLANC)
    doc.text('Montant Total TTC (Dh)', TX + 2, y + 5.5)
    doc.text(fDH(ttc), TX + LW + VW - 1, y + 5.5, { align: 'right' })
    y += 14
  }

  // ── Signatures ────────────────────────────────────────────────────────────
  checkNewPage(40)
  y += 4
  const SW = 80, SH = 30, SY = y
  ;[
    { label: 'Réceptionné par — Client', x: ML },
    { label: 'Livré par — Société',      x: PW - MR - SW },
  ].forEach(({ label, x }) => {
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.3)
    doc.roundedRect(x, SY, SW, SH, 2, 2, 'FD')
    FN(doc, 'bold', 8); ST(doc, BLEU_GMT)
    doc.text(label, x + SW / 2, SY + 5, { align: 'center' })
    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.text('Signature & cachet : _______________', x + SW / 2, SY + SH - 5, { align: 'center' })
  })
  y += SH + 6

  // ── Observations ─────────────────────────────────────────────────────────
  const obs = bl.observations || ''
  if (obs) {
    checkNewPage(15)
    FN(doc, 'bold', 9); ST(doc, ORANGE_GMT)
    doc.text('Observations :', ML, y + 4); y += 6
    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.splitTextToSize(obs, PW - ML - MR).forEach(l => {
      checkNewPage(5); doc.text(l, ML, y + 3); y += 3.5
    })
  }

  // ── Footers sur toutes les pages ──────────────────────────────────────────
  const tot = doc.getNumberOfPages()
  for (let p = 1; p <= tot; p++) { doc.setPage(p); drawFooter(p, tot) }

  doc.save(`BL_${bl.numero || 'XXX'}_${dayjs().format('YYYYMMDD')}.pdf`)
}
export default function BonLivraisonView() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [bl,         setBl]        = useState(null)
  const [entreprise, setEntreprise]= useState(null)
  const [loading,    setLoading]   = useState(true)
  const [pdfLoad,    setPdfLoad]   = useState(false)

  const resolveLogoUrl = (path) => {
    if (!path) return null
    return path.startsWith('http') ? path : `${API_BASE}${path}`
  }

  useEffect(() => {
    const run = async () => {
      try {
        const d = await bonLivraisonService.getById(id)
        setBl(d)
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
        toast.error('Bon de livraison introuvable')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const handleStatut = async (statut) => {
    try {
      setBl(await bonLivraisonService.updateStatut(id, statut))
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur')
    }
  }

  const handlePdf = async () => {
    setPdfLoad(true)
    try { await genererPDF(bl, entreprise) }
    catch (e) { console.error('PDF error:', e); toast.error('Erreur génération PDF') }
    finally { setPdfLoad(false) }
  }

  if (loading) return <Typography p={4}>Chargement…</Typography>
  if (!bl)     return <Typography p={4} color="error">Bon de livraison introuvable</Typography>

  const totalHt  = bl.montantHt  || 0
  const tva      = bl.tva        || 0
  const totalTtc = bl.montantTtc || 0
  const logoUrl  = resolveLogoUrl(entreprise?.logo)
  const statut   = bl.statut || 'en_cours'
  const canEdit  = statut !== 'annule'

  return (
    <Box>

      {/* ── BANDE DÉGRADÉ ──────────────────────────────────────────────────── */}
      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER CARD ────────────────────────────────────────────────────── */}
      <Box
        mb={2.5}
        sx={{
          bgcolor: 'white', border: `1px solid ${BORDER}`,
          borderRadius: 2, px: 2, py: 1.2,
        }}
      >
        {/* Ligne 1 : retour + icône + logo + titre + chips */}
        <Stack direction="row" alignItems="center" gap={1.5} mb={1.2} flexWrap="wrap">
          <IconButton
            onClick={() => navigate('/livraisons')} size="small"
            sx={{
              width: 30, height: 30, borderRadius: '8px', bgcolor: BG_PAGE,
              color: BLUE_DD, flexShrink: 0, '&:hover': { bgcolor: '#dbeafe' },
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>

          <LocalShipping sx={{ color: BLUE, fontSize: 20, flexShrink: 0 }} />

          {logoUrl ? (
            <Box component="img" src={logoUrl} alt="logo"
              sx={{ height: 32, maxWidth: 90, objectFit: 'contain', borderRadius: 1, flexShrink: 0 }} />
          ) : (
            <Avatar sx={{
              width: 32, height: 32, bgcolor: BG_PAGE, color: BLUE_DD,
              fontWeight: 700, fontSize: 13, border: `1px solid ${BORDER}`, flexShrink: 0,
            }}>
              {(entreprise?.nom || '?').charAt(0)}
            </Avatar>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BLUE_DD, lineHeight: 1.2 }}>
              BL {bl.numero}
            </Typography>
            {entreprise?.nom && (
              <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500 }}>
                {entreprise.nom}
              </Typography>
            )}
          </Box>

          <Chip
            label={STATUT_LABELS[statut] || statut}
            color={STATUT_COLORS[statut] || 'default'}
            size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}
          />

          {bl.bonCommandeClientId && (
            <Chip
              label={`BCC ${bl.bonCommandeClientNumero || '#' + bl.bonCommandeClientId}`}
              size="small" variant="outlined"
              onClick={() => navigate(`/commandes-client/${bl.bonCommandeClientId}`)}
              sx={{
                fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                borderColor: BLUE, color: BLUE, cursor: 'pointer',
                '&:hover': { bgcolor: BG_PAGE },
              }}
            />
          )}
        </Stack>

        {/* Ligne 2 : boutons d'action (wrappent sur mobile) */}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {statut === 'en_cours' && (
            <Button size="small"
              onClick={() => handleStatut('livre')}
              sx={{
                border: '1px solid #16A34A50', color: '#15803D',
                borderRadius: '8px', textTransform: 'none',
                fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                '&:hover': { bgcolor: '#F0FDF4', borderColor: '#16A34A' },
              }}
            >
              Marquer livré
            </Button>
          )}
          {statut === 'en_cours' && (
            <Button size="small"
              onClick={() => handleStatut('annule')}
              sx={{
                border: '1px solid #DC262650', color: '#DC2626',
                borderRadius: '8px', textTransform: 'none',
                fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
              }}
            >
              Annuler
            </Button>
          )}

          <Button size="small"
            startIcon={<PictureAsPdf sx={{ fontSize: '15px !important' }} />}
            onClick={handlePdf} disabled={pdfLoad}
            sx={{
              border: `1px solid ${ORANGE}50`, color: ORANGE,
              borderRadius: '8px', textTransform: 'none',
              fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
              '&:hover': { bgcolor: ORANGE_BG, borderColor: ORANGE },
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            {pdfLoad ? 'Génération…' : 'PDF'}
          </Button>

          {canEdit && (
            <Button size="small"
              startIcon={<Edit sx={{ fontSize: '15px !important' }} />}
              onClick={() => navigate(`/livraisons/${id}/modifier`)}
              sx={{
                bgcolor: BLUE, color: 'white',
                borderRadius: '8px', textTransform: 'none',
                fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                boxShadow: `0 4px 12px ${BLUE}30`,
                '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
              }}
            >
              Modifier
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── CONTENU ───────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>

        {/* ── Colonne principale ─────────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>

            {/* Bande titre */}
            <Box sx={{
              bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`,
              px: 2.5, py: 1.1,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 0.5,
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT_S }}>
                BON DE LIVRAISON : {bl.numero}
              </Typography>
              {bl.affaireNom && (
                <Typography sx={{ fontSize: '0.72rem', color: TEXT_M }}>Affaire : {bl.affaireNom}</Typography>
              )}
            </Box>

            {/* Cartes émetteur / client */}
            <Box sx={{ bgcolor: BG_PAGE, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
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

                {/* Client livré */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: `1px solid ${ORANGE}50`, borderRadius: 2, bgcolor: ORANGE_BG, p: 2, height: '100%' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                      Client livré
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: ORANGE, fontSize: '1rem', mb: 1 }}>{bl.clientNom}</Typography>
                    {bl.clientTelephone && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Tél : {bl.clientTelephone}</Typography>}
                    {bl.clientEmail     && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Email : {bl.clientEmail}</Typography>}
                    {bl.clientAdresse   && <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Adresse : {bl.clientAdresse}</Typography>}
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, mt: 0.5 }}>
                      ICE : {bl.clientIce || 'Non renseigné'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Dates & infos */}
                {[
                  { label: 'Date livraison', val: bl.dateLivraison ? dayjs(bl.dateLivraison).format('DD/MM/YYYY') : '—', color: BLUE_DD },
                  { label: 'BCC lié',        val: bl.bonCommandeClientId ? `#${bl.bonCommandeClientId}` : '—',           color: BLUE_DD },
                  { label: 'Affaire',        val: bl.affaireNom || '—',                                                   color: BLUE_DD },
                  { label: 'N° Commande',    val: bl.bonCommandeClientNumero || '—',                                       color: BLUE_DD },
                ].map(({ label, val, color }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color }}>{val}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Tableau articles — scroll horizontal sur mobile */}
            <Box sx={{ px: { xs: 0, sm: 1.5 }, pt: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    {[
                      { label: 'Code',        align: 'left'  },
                      { label: 'Désignation', align: 'left'  },
                      { label: 'Unité',       align: 'left'  },
                      { label: 'Qté livrée',  align: 'right' },
                      { label: 'P.U.',        align: 'right' },
                      { label: 'Montant HT',  align: 'right' },
                    ].map(({ label, align }) => (
                      <TableCell key={label} align={align} sx={{
                        fontSize: '0.65rem', fontWeight: 700, color: TEXT_S,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: `2px solid ${BORDER}`, py: 1,
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bl.details?.map((d, i) => (
                    <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? 'white' : SURFACE3, '&:hover': { bgcolor: BG_PAGE } }}>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_M, whiteSpace: 'nowrap' }}>{d.articleCode}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{d.articleDesignation}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.articleUnite || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: BLUE, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.qte}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {Number(d.prixUnitaire).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: BLUE, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {Number(d.montant).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Totaux */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
              <Stack alignItems="flex-end" gap={0}>
                {[
                  { label: 'Total HT',  val: `${Number(totalHt).toLocaleString('fr-MA',{minimumFractionDigits:2})} MAD`,  bg: 'white', border: `1px solid ${BORDER}`, color: BLUE_DD },
                  { label: 'TVA 20 %',  val: `${Number(tva).toLocaleString('fr-MA',{minimumFractionDigits:2})} MAD`,      bg: 'white', border: `1px solid ${BORDER}`, color: TEXT_M  },
                  { label: 'Total TTC', val: `${Number(totalTtc).toLocaleString('fr-MA',{minimumFractionDigits:2})} MAD`, bg: ORANGE,  border: 'none',                color: 'white' },
                ].map(({ label, val, bg, border, color }, idx) => (
                  <Box key={label} sx={{
                    width: { xs: '100%', sm: 280 },
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    bgcolor: bg, border,
                    borderTop: idx === 0 ? border : 'none',
                    borderRadius: idx === 2 ? '0 0 8px 8px' : 0,
                    px: 2, py: 0.8,
                  }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Zone signature */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Réceptionné par (client)', color: BLUE,   bg: BG_PAGE   },
                  { label: 'Livré par (société)',       color: ORANGE, bg: ORANGE_BG },
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
            {bl.observations && (
              <Box px={{ xs: 1.5, sm: 2.5 }} pb={2}>
                <Divider sx={{ mb: 1.5, borderColor: BORDER }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Observations
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_M, whiteSpace: 'pre-wrap' }}>
                  {bl.observations}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>

          {/* Infos */}
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`, px: 2.5, py: 1.1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT_S }}>
                Informations
              </Typography>
            </Box>
            <Stack
              gap={1.5} p={2}
              direction={{ xs: 'row', md: 'column' }}
              flexWrap="wrap"
            >
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Numéro</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: BLUE }}>{bl.numero}</Typography>
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
                  {dayjs(bl.dateCreation).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>
              {bl.dateLivraison && (
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Date de livraison</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BLUE_DD }}>
                    {dayjs(bl.dateLivraison).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              )}
              {bl.bonCommandeClientId && (
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>BCC d'origine</Typography>
                  <Button size="small"
                    onClick={() => navigate(`/commandes-client/${bl.bonCommandeClientId}`)}
                    sx={{
                      display: 'block', mt: 0.5,
                      border: `1px solid ${BLUE}50`, color: BLUE,
                      borderRadius: '8px', textTransform: 'none',
                      fontSize: '0.72rem', fontWeight: 700,
                      '&:hover': { bgcolor: BG_PAGE, borderColor: BLUE },
                    }}
                  >
                    Voir BCC {bl.bonCommandeClientNumero || `#${bl.bonCommandeClientId}`}
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Mouvement de stock */}
          <Box sx={{ bgcolor: 'white', border: `1px solid ${ORANGE}40`, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: ORANGE_BG, borderBottom: `1px solid ${ORANGE}40`, px: 2.5, py: 1.1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: ORANGE }}>
                Mouvement de stock
              </Typography>
            </Box>
            <Box p={2}>
              <Typography sx={{ fontSize: '0.78rem', color: TEXT_M, lineHeight: 1.9 }}>
                Stock déduit à la création du BL.<br />
                Stock restauré en cas d'annulation ou suppression.<br />
                La modification recalcule automatiquement le stock.
              </Typography>
            </Box>
          </Box>

        </Grid>
      </Grid>
    </Box>
  )
}