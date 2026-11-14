import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Stack, Button, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Alert, Avatar
} from '@mui/material'
import { ArrowBack, Edit, PictureAsPdf } from '@mui/icons-material'
import devisService      from '../../../services/devisService'
import entrepriseService from '../../../services/entrepriseService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

// ─── Constantes PDF (jsPDF) ──────────────────────────────────────────────────
const BLEU_GMT      = [0,   102, 204]
const BLEU_FONCE    = [0,   51,  102]
const ORANGE_GMT    = [255, 165, 0  ]
const ORANGE_CLAIR  = [255, 248, 230]
const BLEU_CLAIR_BG = [230, 242, 255]
const BLANC         = [255, 255, 255]
const NOIR          = [0,   0,   0  ]
const BLEU_DECO     = [173, 216, 230]
// ─── Palette alignée sur DevisForm ──────────────────────────────────────────
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const SF = (d,c) => d.setFillColor(c[0],c[1],c[2])
const SD = (d,c) => d.setDrawColor(c[0],c[1],c[2])
const ST = (d,c) => d.setTextColor(c[0],c[1],c[2])
const FN = (d,s,z) => { d.setFont('helvetica',s); d.setFontSize(z) }

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

const fDH = n => n != null ? Number(n).toLocaleString('fr-MA',{minimumFractionDigits:2})+' DH' : '—'
const STATUT_COLOR = {brouillon:'default',envoye:'info',accepte:'success',refuse:'error',expire:'warning'}

// ═══════════════════════════════════════════════════════════════════════════════
//  GÉNÉRATION PDF
// ═══════════════════════════════════════════════════════════════════════════════
async function genererPDF(devis, entreprise) {

  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const PW = 210, PH = 297, ML = 10, MR = 10

  // ── Logo via canvas ────────────────────────────────────────────────────────
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
    } catch (e) { logoB64 = null }
  }

  // ── Données client complètes ───────────────────────────────────────────────
  const cNom   = devis.clientNom       || devis.client_nom       || ''
  const cTel   = devis.clientTelephone || devis.client_telephone || ''
  const cEmail = devis.clientEmail     || devis.client_email     || ''
  const cAdr   = devis.clientAdresse   || devis.client_adresse   || ''
  const cIce   = devis.clientIce       || devis.client_ice       || ''
  const affaire= devis.affaireNom      || devis.affaire_nom      || '-'
  const dateDev= dayjs(devis.dateDevis || devis.date_devis).format('DD/MM/YYYY')
  const dateVal= devis.dateValidite ? dayjs(devis.dateValidite).format('DD/MM/YYYY') : '-'
  const ht     = Number(devis.montantHt  || devis.montant_ht  || 0)
  const tva    = Number(devis.tva || 0)
  const ttc    = Number(devis.montantTtc || devis.montant_ttc || 0)
  const lignes = devis.details || devis.lignes || []

  // ── Conditions de paiement (dynamique) ────────────────────────────────────
  const condPaiement = (devis.conditionsPaiement && devis.conditionsPaiement.trim())
    ? devis.conditionsPaiement.trim()
    : null

  const BLIMIT = PH - 30

  function calcH(ls) {
    let h = 8
    ls.forEach(l => { if(l) h += l.length > 100 ? Math.ceil(l.length/50)*4 : 4 })
    return Math.max(h + 4, 30)
  }

  const entrepriseLines = [
    entreprise?.nom, entreprise?.responsable,
    entreprise?.telephone, entreprise?.email, entreprise?.ice
  ].filter(Boolean)

  // Lignes client enrichies
  const clientLines = [
    cNom,
    cTel   ? 'Tél: '+cTel   : null,
    cEmail ? 'E-mail: '+cEmail : null,
    cAdr   ? 'Adr: '+cAdr   : null,
    cIce   ? 'ICE: '+cIce   : null,
  ].filter(Boolean)

  const hE   = calcH(entrepriseLines)
  const hC   = calcH(clientLines)
  const hBandeau = Math.max(Math.max(hE, hC), 30)
  const CW = 90

  function drawHeader() {
    SF(doc, BLANC); SD(doc, BLANC); doc.setLineWidth(0.1)
    doc.rect(0, 0, PW, 35, 'F')
    if (logoB64) {
      const imgType = logoB64.startsWith('data:image/jpeg') ? 'JPEG'
                    : logoB64.startsWith('data:image/webp') ? 'WEBP'
                    : 'PNG'
      doc.addImage(logoB64, imgType, 10, 5, 42, 27)
    } else {
      SF(doc, BLEU_FONCE); SD(doc, BLEU_FONCE); doc.setLineWidth(0)
      doc.circle(25, 17, 12, 'F')
      SF(doc, BLANC); doc.circle(25, 17, 9, 'F')
      FN(doc, 'bold', 8); ST(doc, BLEU_FONCE)
      const ini = (entreprise?.nom||'GMT').replace(/[^A-Za-z]/g,'').substring(0,3).toUpperCase()
      doc.text(ini, 25, 19, {align:'center'})
    }

   
  }

  function drawInfoBandeau(startY) {
    const h = hBandeau

    // ── Cadre Entreprise (gauche) ──────────────────────────────────────────
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(ML, startY, CW, h, 3, 3, 'FD')
    FN(doc, 'bold', 11); ST(doc, BLEU_GMT)
    doc.text(entreprise?.nom || '', ML + 3, startY + 7)
    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yi = startY + 13
    if (entreprise?.responsable) { doc.text('Resp: '+entreprise.responsable, ML+3, yi); yi += 4 }
    if (entreprise?.telephone)   { doc.text('Tél: '+entreprise.telephone,    ML+3, yi); yi += 4 }
    if (entreprise?.email)       { doc.text('E-mail: '+entreprise.email,     ML+3, yi); yi += 4 }
    if (entreprise?.ice)         { FN(doc,'bold',8); ST(doc,NOIR); doc.text('ICE: '+entreprise.ice, ML+3, yi) }

    // ── Cadre Client (droite) — infos complètes ─────────────────────────────
    SF(doc, BLANC); SD(doc, ORANGE_GMT); doc.setLineWidth(0.5)
    doc.roundedRect(110, startY, CW, h, 3, 3, 'FD')
    FN(doc, 'bold', 11); ST(doc, ORANGE_GMT)
    doc.text(cNom, 113, startY + 7)
    FN(doc, 'normal', 8); ST(doc, NOIR)
    let yj = startY + 13

    if (cTel) {
      doc.text('Tél: '+cTel, 113, yj); yj += 4
    }
    if (cEmail) {
      doc.text('E-mail: '+cEmail, 113, yj); yj += 4
    }
    if (cAdr) {
      FN(doc, 'normal', 7.5)
      const adrLines = doc.splitTextToSize('Adresse: '+cAdr, 84)
      adrLines.forEach(l => {
        if (yj < startY + h - 4) { doc.text(l, 113, yj); yj += 3.5 }
      })
      FN(doc, 'normal', 8)
    }
    if (cIce && yj < startY + h - 2) {
      FN(doc, 'bold', 8); ST(doc, NOIR)
      doc.text('ICE: '+cIce, 113, yj)
    }

    return startY + h + 5
  }

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
    if (entreprise?.adresse)   P.push('Adresse : '+entreprise.adresse)
    if (entreprise?.telephone) P.push('Tél : '+entreprise.telephone)
    if (entreprise?.fax)       P.push('Fax : '+entreprise.fax)
    const sw = entreprise?.siteWeb || entreprise?.site_web
    if (sw)                    P.push('Site Web : '+sw)
    if (entreprise?.email)     P.push('E-mail : '+entreprise.email)
    if (entreprise?.ifiscale)  P.push('I.F. : '+entreprise.ifiscale)
    if (entreprise?.cnss)      P.push('CNSS : '+entreprise.cnss)
    if (entreprise?.patente)   P.push('Patente : '+entreprise.patente)
    if (entreprise?.rc)        P.push('R.C. : '+entreprise.rc)
    if (entreprise?.ice)       P.push('ICE : '+entreprise.ice)
    const cb = entreprise?.compteBancaire || entreprise?.compte_bancaire
    if (cb)                    P.push('C.B. : '+cb)

    FN(doc, 'normal', 7); ST(doc, NOIR)
    doc.splitTextToSize(P.join(' | '), PW - 20).forEach((l, i) =>
      doc.text(l, PW/2, yB + 7 + i * 3.5, {align:'center'}))

    if (pTot > 1) {
      const pt = `Page ${pNum} sur ${pTot}`
      const pw2 = doc.getTextWidth(pt)
      SF(doc, BLANC); SD(doc, BLANC); doc.setLineWidth(0)
      doc.rect(PW - MR - pw2 - 6, yB - 3.5, pw2 + 4, 6, 'F')
      FN(doc, 'normal', 8); ST(doc, NOIR)
      doc.text(pt, PW - MR - pw2 - 4, yB + 0.5)
    }
  }

  let y = 38

  function checkNewPage(needed = 10) {
    if (y + needed > BLIMIT) {
      doc.addPage()
      drawHeader()
      y = drawInfoBandeau(38)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 1
  // ══════════════════════════════════════════════════════════════════════════
  drawHeader()
  y = drawInfoBandeau(y)

  // ── Titre DEVIS + dates ───────────────────────────────────────────────────
  FN(doc, 'bold', 14); ST(doc, NOIR)
  doc.text('DEVIS : '+(devis.numero||''), ML, y + 8)
  y += 14

  // ── Tableau infos (5 colonnes) — sans "Code client" ───────────────────────
  const CL = 38, RH = 8

  ;['Affaire','Date devis','Validité','Net à payer HT','Net à payer TTC'].forEach((h, i) => {
    SF(doc, BLEU_CLAIR_BG); SD(doc, BLEU_GMT); doc.setLineWidth(0.2)
    doc.rect(ML + i*CL, y, CL, RH, 'FD')
    FN(doc, 'bold', 9); ST(doc, NOIR)
    doc.text(h, ML + i*CL + CL/2, y + 5.5, {align:'center'})
  })
  y += RH

  const infoY = y
  ;[null, dateDev, dateVal, fDH(ht), fDH(ttc)].forEach((v, i) => {
    SF(doc, BLANC); SD(doc, BLEU_GMT); doc.setLineWidth(0.2)
    doc.rect(ML + i*CL, infoY, CL, RH, 'FD')
    if (v) { FN(doc,'normal',9); ST(doc,NOIR); doc.text(v, ML+i*CL+CL/2, infoY+5.5, {align:'center'}) }
  })
  // Affaire (colonne 0) — texte long
  FN(doc, 'normal', 9); ST(doc, NOIR)
  doc.splitTextToSize(affaire, CL - 4).forEach((l, i) => doc.text(l, ML+2, infoY+3.5+i*3.5))
  y += RH + 5

  // ── Tableau articles ──────────────────────────────────────────────────────
  const AC = [15, 85, 15, 20, 25, 30]
  const AH = ['N°', 'Désignation', 'Unité', 'Quantité', 'P.U. (DH)', 'P.T. (DH)']

  const DESIG_FONT_SIZE  = 6.5
  const DESIG_LINE_H     = 3.2
  const DESIG_MIN_ROW_H  = 6

  function drawArtHeader(yy) {
    let xi = ML
    AC.forEach((w, i) => {
      SF(doc, BLANC); SD(doc, BLEU_FONCE); doc.setLineWidth(0.3)
      doc.rect(xi, yy, w, 8, 'FD')
      FN(doc, 'bold', 9); ST(doc, NOIR)
      doc.text(AH[i], xi + w/2, yy + 5.5, {align:'center'})
      xi += w
    })
    return yy + 8
  }

  if (lignes.length > 0) {
    checkNewPage(20)
    y = drawArtHeader(y)

    let lineNum = 1
    lignes.forEach(ligne => {
      const desig = ligne.designation || ligne.articleDesignation || ''
      const unite = ligne.articleUnite || ligne.unite || '—'
      const qte   = Number(ligne.qte || ligne.quantite || 0)
      const pu    = Number(ligne.prixUnitaire || ligne.prix_unitaire || 0)
      const pt    = qte * pu

      doc.setFontSize(DESIG_FONT_SIZE)
      const dLines = doc.splitTextToSize(desig, 83)
      const lH     = Math.max(DESIG_MIN_ROW_H, dLines.length * DESIG_LINE_H + 2)

      if (y + lH > BLIMIT) {
        doc.addPage(); drawHeader()
        y = drawInfoBandeau(38)
        y = drawArtHeader(y)
      }

      const sy = y; let xi = ML

      // N°
      SF(doc,BLANC); SD(doc,BLEU_FONCE); doc.setLineWidth(0.3)
      doc.rect(xi, sy, AC[0], lH, 'FD')
      FN(doc,'normal',8); ST(doc,NOIR)
      doc.text(String(lineNum), xi+AC[0]/2, sy+lH/2+1, {align:'center'})
      xi += AC[0]

      // Désignation
      SF(doc,BLANC); SD(doc,BLEU_GMT); doc.setLineWidth(0.3)
      doc.rect(xi, sy, AC[1], lH, 'FD')
      FN(doc,'normal', DESIG_FONT_SIZE); ST(doc,NOIR)
      dLines.forEach((dl, di) => doc.text(dl, xi+1, sy+2.5+(di*DESIG_LINE_H)))
      xi += AC[1]

      ;[[AC[2], unite,                                                  'center'],
        [AC[3], qte.toLocaleString('fr-MA',{minimumFractionDigits:2}), 'center'],
        [AC[4], pu.toLocaleString ('fr-MA',{minimumFractionDigits:2}), 'right' ],
        [AC[5], pt.toLocaleString ('fr-MA',{minimumFractionDigits:2}), 'right' ],
      ].forEach(([w, v, al]) => {
        SF(doc,BLANC); SD(doc,BLEU_GMT); doc.setLineWidth(0.3)
        doc.rect(xi, sy, w, lH, 'FD')
        FN(doc,'normal',8); ST(doc,NOIR)
        doc.text(v, al==='right' ? xi+w-1 : xi+w/2, sy+lH/2+1, {align:al})
        xi += w
      })
      y += lH
      lineNum++
    })

    // ── Totaux ──────────────────────────────────────────────────────────────
    checkNewPage(22)
    y += 2

    FN(doc,'bold',9); ST(doc,BLEU_GMT)
    doc.text('Arrêté le présent devis à la somme de :', ML, y+4.5)
    FN(doc,'italic',7); ST(doc,NOIR)
    doc.splitTextToSize(enLettres(ttc), 95).forEach((l,i) => doc.text(l, ML, y+10+i*3.5))

    const TX = ML + 100
    const TW = PW - TX - MR
    const LW = TW * 0.6
    const VW = TW * 0.4

    SF(doc,ORANGE_CLAIR); SD(doc,ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD')
    doc.rect(TX+LW, y, VW, 8, 'FD')
    FN(doc,'bold',9); ST(doc,NOIR)
    doc.text('Montant Total H.T (Dh)', TX+2, y+5.5)
    doc.text(fDH(ht), TX+LW+VW-1, y+5.5, {align:'right'})
    y += 8

    SF(doc,ORANGE_CLAIR); SD(doc,ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD')
    doc.rect(TX+LW, y, VW, 8, 'FD')
    FN(doc,'bold',9); ST(doc,NOIR)
    doc.text('Montant Total TVA (Dh)', TX+2, y+5.5)
    doc.text(fDH(tva), TX+LW+VW-1, y+5.5, {align:'right'})
    y += 8

    SF(doc,ORANGE_GMT); SD(doc,ORANGE_GMT); doc.setLineWidth(0.3)
    doc.rect(TX, y, LW, 8, 'FD')
    doc.rect(TX+LW, y, VW, 8, 'FD')
    FN(doc,'bold',9); ST(doc,BLANC)
    doc.text('Montant Total TTC (Dh)', TX+2, y+5.5)
    doc.text(fDH(ttc), TX+LW+VW-1, y+5.5, {align:'right'})
    y += 14
  }

  // ─────────────────────────────────────────────────────────────────────────
// CONDITIONS DE PAIEMENT — sans cadre
// ─────────────────────────────────────────────────────────────────────────
if (condPaiement) {
  const condLines = condPaiement.split('\n').filter(l => l.trim())
  const blockH = 8 + condLines.length * 4 + 6
  checkNewPage(blockH + 6)

  // Titre seulement
  FN(doc, 'bold', 9)
  ST(doc, BLEU_GMT)
  doc.text('Conditions générales', ML, y + 5)
  y += 8

  // Contenu sans rectangle
  FN(doc, 'normal', 8)
  ST(doc, NOIR)

  condLines.forEach((line, i) => {
    doc.text(line.trim(), ML + 2, y + 5 + i * 4)
  })

  y += condLines.length * 4 + 8

} else {
  checkNewPage(15)

  FN(doc, 'bold', 9)
  ST(doc, BLEU_GMT)
  doc.text('Conditions générales', ML, y + 5)

  y += 8

  FN(doc, 'normal', 8)
  ST(doc, [150, 150, 150])
  doc.text('Aucune condition renseignée.', ML + 2, y + 5)

  y += 10
}

  // ── Observations ─────────────────────────────────────────────────────────
  const obs = devis.observations || ''
  if (obs) {
    checkNewPage(15)
    FN(doc,'bold',9); ST(doc,ORANGE_GMT)
    doc.text('Observations :', ML, y+4); y += 6
    FN(doc,'normal',7); ST(doc,NOIR)
    doc.splitTextToSize(obs, PW - ML - MR).forEach(l => {
      checkNewPage(5); doc.text(l, ML, y+3); y += 3.5
    })
  }

  // ── Footer sur toutes les pages ───────────────────────────────────────────
  const tot = doc.getNumberOfPages()
  for (let p = 1; p <= tot; p++) { doc.setPage(p); drawFooter(p, tot) }

  doc.save(`Devis_${devis.numero||'XXX'}_${dayjs().format('YYYYMMDD')}.pdf`)
}
export default function DevisView() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [devis,      setDevis]     = useState(null)
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
        const d = await devisService.getById(id)
        setDevis(d)
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
        toast.error('Devis introuvable')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const handleStatut = async (statut) => {
    try {
      setDevis(await devisService.updateStatut(id, statut))
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur')
    }
  }

  const handlePdf = async () => {
    setPdfLoad(true)
    try {
      await genererPDF(devis, entreprise)
    } catch (e) {
      console.error('PDF error:', e)
      toast.error('Erreur génération PDF')
    } finally {
      setPdfLoad(false)
    }
  }

  if (loading) return <Typography p={4}>Chargement…</Typography>
  if (!devis)  return <Typography p={4} color="error">Devis introuvable</Typography>

  const estExpire =
    dayjs(devis.dateValidite).isBefore(dayjs()) &&
    ['brouillon', 'envoye'].includes(devis.statut)

  const totalHt  = devis.montantHt  || 0
  const tva      = devis.tva        || 0
  const totalTtc = devis.montantTtc || 0
  const logoUrl  = resolveLogoUrl(entreprise?.logo)

  return (
    <Box>

      <Box sx={{
        height: 3, borderRadius: 2, mb: 2,
        background: 'linear-gradient(90deg, #1A6FE8 0%, #F59E0B 60%, #fde68a 100%)',
      }} />

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <Box
        mb={2.5}
        sx={{
          bgcolor: 'white', border: `1px solid ${BORDER}`,
          borderRadius: 2, px: 2, py: 1.2,
        }}
      >
        {/* Ligne 1 : retour + logo + titre + chip */}
        <Stack direction="row" alignItems="center" gap={1.5} mb={1.2} flexWrap="wrap">
          <IconButton
            onClick={() => navigate('/devis')}
            size="small"
            sx={{
              width: 30, height: 30, borderRadius: '8px', bgcolor: BG_PAGE,
              color: BLUE_DD, flexShrink: 0, '&:hover': { bgcolor: '#dbeafe' },
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
          </IconButton>

          {logoUrl ? (
            <Box
              component="img" src={logoUrl} alt="logo"
              sx={{ height: 32, maxWidth: 90, objectFit: 'contain', borderRadius: 1, flexShrink: 0 }}
            />
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
              Devis {devis.numero}
            </Typography>
            {entreprise?.nom && (
              <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 500 }}>
                {entreprise.nom}
              </Typography>
            )}
          </Box>

          <Chip
            label={devis.statut}
            color={STATUT_COLOR[devis.statut] || 'default'}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}
          />
        </Stack>

        {/* Ligne 2 : boutons d'action (wrappent sur mobile) */}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {devis.statut === 'brouillon' && (
            <Button
              size="small" onClick={() => handleStatut('envoye')}
              sx={{
                border: `1px solid ${BLUE}50`, color: BLUE_DD,
                borderRadius: '8px', textTransform: 'none',
                fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                '&:hover': { bgcolor: BG_PAGE, borderColor: BLUE },
              }}
            >
              Marquer envoyé
            </Button>
          )}

          {devis.statut === 'envoye' && (
            <>
              <Button
                size="small" onClick={() => handleStatut('accepte')}
                sx={{
                  border: '1px solid #16A34A50', color: '#15803D',
                  borderRadius: '8px', textTransform: 'none',
                  fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                  '&:hover': { bgcolor: '#F0FDF4', borderColor: '#16A34A' },
                }}
              >
                Accepter
              </Button>
              <Button
                size="small" onClick={() => handleStatut('refuse')}
                sx={{
                  border: '1px solid #DC262650', color: '#DC2626',
                  borderRadius: '8px', textTransform: 'none',
                  fontSize: '0.72rem', fontWeight: 700, px: 1.8, py: 0.7,
                  '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
                }}
              >
                Refuser
              </Button>
            </>
          )}

          <Button
            size="small"
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

          {['brouillon', 'envoye'].includes(devis.statut) && (
            <Button
              size="small"
              startIcon={<Edit sx={{ fontSize: '15px !important' }} />}
              onClick={() => navigate(`/devis/${id}/modifier`)}
              sx={{
                bgcolor: BLUE, color: 'white', borderRadius: '8px',
                textTransform: 'none', fontSize: '0.72rem', fontWeight: 700,
                px: 1.8, py: 0.7, boxShadow: `0 4px 12px ${BLUE}30`,
                '&:hover': { bgcolor: BLUE_D, boxShadow: `0 4px 16px ${BLUE}40` },
              }}
            >
              Modifier
            </Button>
          )}
        </Stack>
      </Box>

      {estExpire && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderLeft: `4px solid ${ORANGE}`, bgcolor: ORANGE_BG, borderRadius: 2 }}
        >
          Ce devis a expiré le {dayjs(devis.dateValidite).format('DD/MM/YYYY')}
        </Alert>
      )}

      <Grid container spacing={2.5}>

        {/* ── COLONNE PRINCIPALE ─────────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>

            {/* En-tête section */}
            <Box sx={{
              bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`,
              px: 2.5, py: 1.1,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 0.5,
            }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.06em', color: TEXT_S,
              }}>
                DEVIS : {devis.numero}
              </Typography>
              {devis.affaireNom && (
                <Typography sx={{ fontSize: '0.72rem', color: TEXT_M }}>
                  Affaire : {devis.affaireNom}
                </Typography>
              )}
            </Box>

            {/* Bloc émetteur / client */}
            <Box sx={{ bgcolor: BG_PAGE, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
              <Grid container spacing={2}>

                {/* Émetteur */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    border: `1px solid ${BLUE}30`, borderRadius: 2,
                    bgcolor: 'white', p: 2, height: '100%',
                  }}>
                    <Typography sx={{
                      fontSize: '0.65rem', fontWeight: 700, color: BLUE,
                      textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5,
                    }}>
                      Émetteur
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={1} mb={1}>
                      {logoUrl && (
                        <Box component="img" src={logoUrl} alt="logo"
                          sx={{ height: 24, maxWidth: 60, objectFit: 'contain' }} />
                      )}
                      <Typography sx={{ fontWeight: 800, color: BLUE_DD, fontSize: '0.9rem' }}>
                        {entreprise?.nom || '—'}
                      </Typography>
                    </Stack>
                    {entreprise?.telephone && (
                      <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Tél : {entreprise.telephone}</Typography>
                    )}
                    {entreprise?.email && (
                      <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>Email : {entreprise.email}</Typography>
                    )}
                    {entreprise?.ice && (
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, mt: 0.5 }}>
                        ICE : {entreprise.ice}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Client */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    border: `1px solid ${ORANGE}50`, borderRadius: 2,
                    bgcolor: ORANGE_BG, p: 2, height: '100%',
                  }}>
                    <Typography sx={{
                      fontSize: '0.65rem', fontWeight: 700, color: ORANGE,
                      textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5,
                    }}>
                      Client
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: ORANGE, fontSize: '1rem', mb: 1 }}>
                      {devis.clientNom}
                    </Typography>
                    {devis.clientTelephone && (
                      <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>
                        Tél : {devis.clientTelephone}
                      </Typography>
                    )}
                    {devis.clientEmail && (
                      <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>
                        Email : {devis.clientEmail}
                      </Typography>
                    )}
                    {devis.clientAdresse && (
                      <Typography sx={{ fontSize: '0.78rem', color: TEXT_M }}>
                        Adresse : {devis.clientAdresse}
                      </Typography>
                    )}
                    {devis.clientIce && (
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: BLUE_DD, mt: 0.5 }}>
                        ICE : {devis.clientIce}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Dates et infos */}
                {[
                  { label: 'Date du devis', val: dayjs(devis.dateDevis).format('DD/MM/YYYY'),    color: BLUE_DD },
                  { label: 'Validité',      val: dayjs(devis.dateValidite).format('DD/MM/YYYY'), color: estExpire ? '#DC2626' : BLUE_DD },
                  { label: 'Affaire',       val: devis.affaireNom || '—',                        color: BLUE_DD },
                  { label: 'Créé le',       val: dayjs(devis.dateCreation).format('DD/MM/YYYY'),  color: BLUE_DD },
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

            {/* Tableau des lignes — scroll horizontal sur mobile */}
            <Box sx={{ px: { xs: 0, sm: 1.5 }, pt: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    {[
                      { label: 'Code',        align: 'left'  },
                      { label: 'Désignation', align: 'left'  },
                      { label: 'Unité',       align: 'left'  },
                      { label: 'Qté',         align: 'right' },
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
                  {devis.details?.map((d, i) => (
                    <TableRow key={i} sx={{
                      bgcolor: i % 2 === 0 ? 'white' : SURFACE3,
                      '&:hover': { bgcolor: BG_PAGE },
                    }}>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_M, whiteSpace: 'nowrap' }}>{d.articleCode}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{d.articleDesignation}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.articleUnite || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.qte}</TableCell>
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

            {/* Observations */}
            {devis.observations && (
              <Box px={{ xs: 1.5, sm: 2.5 }} pb={2}>
                <Divider sx={{ mb: 1.5, borderColor: BORDER }} />
                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 700, color: ORANGE,
                  textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5,
                }}>
                  Observations
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_M, whiteSpace: 'pre-wrap' }}>
                  {devis.observations}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* ── COLONNE LATÉRALE ───────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>

          {/* Informations */}
          <Box sx={{ bgcolor: 'white', border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{
              bgcolor: SURFACE3, borderBottom: `1px solid ${BORDER}`,
              px: 2.5, py: 1.1,
            }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.06em', color: TEXT_S,
              }}>
                Informations
              </Typography>
            </Box>
            <Stack
              gap={1.5} p={2}
              direction={{ xs: 'row', md: 'column' }}
              flexWrap="wrap"
            >
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Créé le</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: BLUE_DD }}>
                  {dayjs(devis.dateCreation).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: '0.65rem', color: TEXT_S, fontWeight: 600 }}>Numéro</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: BLUE }}>
                  {devis.numero}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Conditions de paiement */}
          <Box sx={{
            bgcolor: 'white',
            border: devis.conditionsPaiement
              ? `1px solid ${BLUE}40`
              : `1px solid ${BORDER}`,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <Box sx={{
              bgcolor: devis.conditionsPaiement ? BG_PAGE : SURFACE3,
              borderBottom: `1px solid ${devis.conditionsPaiement ? BLUE+'30' : BORDER}`,
              px: 2.5, py: 1.1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: devis.conditionsPaiement ? BLUE_DD : TEXT_S,
              }}>
                Conditions générales
              </Typography>
              {devis.conditionsPaiement && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
              )}
            </Box>
            <Box p={2}>
              {devis.conditionsPaiement ? (
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_M, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {devis.conditionsPaiement}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '0.78rem', color: TEXT_S, fontStyle: 'italic' }}>
                  Aucune condition renseignée.
                </Typography>
              )}
            </Box>
          </Box>

        </Grid>
      </Grid>
    </Box>
  )
}