package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonReceptionFournisseurDTO;
import com.gestion.commerciale.entity.BonReceptionFournisseur;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class BonReceptionFournisseurPdfService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Palette — violet/indigo pour différencier visuellement le BRF
    private static final DeviceRgb COLOR_PRIMARY    = new DeviceRgb(79,  70, 229);
    private static final DeviceRgb COLOR_PRIMARY_BG = new DeviceRgb(238, 242, 255);
    private static final DeviceRgb COLOR_HEADER_BG  = new DeviceRgb(245, 245, 245);
    private static final DeviceRgb COLOR_TEXT_MUTED = new DeviceRgb(117, 117, 117);
    private static final DeviceRgb COLOR_WHITE      = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb COLOR_ROW_ALT    = new DeviceRgb(248, 249, 250);
    private static final DeviceRgb COLOR_SEPARATOR  = new DeviceRgb(220, 220, 220);
    private static final DeviceRgb COLOR_ORANGE     = new DeviceRgb(245, 158,  11);
    private static final DeviceRgb COLOR_ORANGE_BG  = new DeviceRgb(255, 251, 235);
    private static final DeviceRgb COLOR_GREEN      = new DeviceRgb( 46, 125,  50);
    private static final DeviceRgb COLOR_GREEN_BG   = new DeviceRgb(232, 245, 233);

    public byte[] generatePdf(BonReceptionFournisseurDTO br) throws IOException {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf      = new PdfDocument(new PdfWriter(baos));
        Document    document = new Document(pdf, PageSize.A4);
        document.setMargins(36, 40, 36, 40);

        PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

        // ─────────────────────────────────────────────────────────────
        // 1. EN-TÊTE
        // ─────────────────────────────────────────────────────────────
        Table header = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER);

        Cell societeCell = new Cell().setBorder(Border.NO_BORDER).setPaddingRight(10);
        societeCell.add(new Paragraph("VOTRE SOCIÉTÉ")
                .setFont(bold).setFontSize(20).setFontColor(COLOR_PRIMARY).setMarginBottom(4));
        societeCell.add(new Paragraph("123 Rue des Affaires, Casablanca")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        societeCell.add(new Paragraph("Tél : +212 5XX-XXXXXX  |  contact@votresociete.ma")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        societeCell.add(new Paragraph("RC : 123456  |  ICE : 001234567000056")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        header.addCell(societeCell);

        Cell refCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        refCell.add(new Paragraph("BON DE RÉCEPTION FOURNISSEUR")
                .setFont(bold).setFontSize(15).setFontColor(COLOR_PRIMARY).setMarginBottom(2));
        refCell.add(new Paragraph("N°  " + safe(br.getNumero()))
                .setFont(bold).setFontSize(12).setFontColor(COLOR_PRIMARY));
        refCell.add(new Paragraph("Date de réception : " + fmtDate(br.getDateReception()))
                .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED));
        if (br.getDateCreation() != null) {
            refCell.add(new Paragraph("Créé le : " + br.getDateCreation()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED));
        }
        refCell.add(new Paragraph(formatStatut(br.getStatut()))
                .setFont(bold).setFontSize(9).setFontColor(statusColor(br.getStatut()))
                .setMarginTop(4));
        header.addCell(refCell);

        document.add(header);
        document.add(new LineSeparator(new SolidLine(1f)).setMarginTop(10).setMarginBottom(14));

        // ─────────────────────────────────────────────────────────────
        // 2. BLOC FOURNISSEUR + AFFAIRE / BCF lié
        // ─────────────────────────────────────────────────────────────
        Table fournisseurTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(18);

        Cell fournisseurCell = new Cell()
                .setBackgroundColor(COLOR_PRIMARY_BG)
                .setBorder(new SolidBorder(COLOR_PRIMARY, 1f))
                .setBorderRadius(new BorderRadius(4))
                .setPadding(10);
        fournisseurCell.add(new Paragraph("FOURNISSEUR")
                .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                .setCharacterSpacing(1).setMarginBottom(4));
        fournisseurCell.add(new Paragraph(safe(br.getFournisseurNom()))
                .setFont(bold).setFontSize(13).setFontColor(COLOR_PRIMARY));
        fournisseurTable.addCell(fournisseurCell);

        Cell rightInfoCell;
        if (br.getAffaireNom() != null) {
            rightInfoCell = new Cell()
                    .setBackgroundColor(COLOR_ORANGE_BG)
                    .setBorder(new SolidBorder(COLOR_ORANGE, 1f))
                    .setBorderRadius(new BorderRadius(4))
                    .setPadding(10)
                    .setMarginLeft(8);
            rightInfoCell.add(new Paragraph("AFFAIRE")
                    .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                    .setCharacterSpacing(1).setMarginBottom(4));
            rightInfoCell.add(new Paragraph(safe(br.getAffaireNom()))
                    .setFont(bold).setFontSize(13).setFontColor(COLOR_ORANGE));
        } else if (br.getBonCommandeFournisseurId() != null) {
            rightInfoCell = new Cell()
                    .setBackgroundColor(COLOR_GREEN_BG)
                    .setBorder(new SolidBorder(COLOR_GREEN, 1f))
                    .setBorderRadius(new BorderRadius(4))
                    .setPadding(10)
                    .setMarginLeft(8);
            rightInfoCell.add(new Paragraph("BON DE COMMANDE LIÉ")
                    .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                    .setCharacterSpacing(1).setMarginBottom(4));
            rightInfoCell.add(new Paragraph("BCF N° " + br.getBonCommandeFournisseurId())
                    .setFont(bold).setFontSize(13).setFontColor(COLOR_GREEN));
        } else {
            rightInfoCell = new Cell().setBorder(Border.NO_BORDER);
        }
        fournisseurTable.addCell(rightInfoCell);
        document.add(fournisseurTable);

        // ─────────────────────────────────────────────────────────────
        // 3. TABLEAU DES LIGNES
        // ─────────────────────────────────────────────────────────────
        Table lignes = new Table(UnitValue.createPercentArray(new float[]{8f, 44f, 10f, 19f, 19f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(6);

        addHeaderCell(lignes, "#",                bold, TextAlignment.CENTER);
        addHeaderCell(lignes, "Désignation",      bold, TextAlignment.LEFT);
        addHeaderCell(lignes, "Qté reçue",        bold, TextAlignment.CENTER);
        addHeaderCell(lignes, "Prix unitaire HT", bold, TextAlignment.RIGHT);
        addHeaderCell(lignes, "Montant HT",       bold, TextAlignment.RIGHT);

        if (br.getDetails() != null) {
            int n = 1;
            for (BonReceptionFournisseurDTO.DetailDTO det : br.getDetails()) {
                DeviceRgb bg = (n % 2 == 0) ? COLOR_ROW_ALT : COLOR_WHITE;
                String designation = safe(det.getArticleCode())
                        + (det.getArticleDesignation() != null
                            ? " – " + det.getArticleDesignation() : "");

                // ✅ FIX : conversion vers BigDecimal avant d'appeler fmtQte()
                BigDecimal qteBd = toBigDecimal(det.getQte());

                addDataCell(lignes, String.valueOf(n),                   regular, 8,  TextAlignment.CENTER, bg);
                addDataCell(lignes, designation,                         regular, 9,  TextAlignment.LEFT,   bg);
                addDataCell(lignes, fmtQte(qteBd),                       regular, 9,  TextAlignment.CENTER, bg);
                addDataCell(lignes, fmt(det.getPrixUnitaire()) + " MAD", regular, 9,  TextAlignment.RIGHT,  bg);
                addDataCell(lignes, fmt(det.getMontant())      + " MAD", bold,    9,  TextAlignment.RIGHT,  bg);
                n++;
            }
        }
        document.add(lignes);

        // ─────────────────────────────────────────────────────────────
        // 4. TOTAL HT
        // ─────────────────────────────────────────────────────────────
        BigDecimal totalHt = calcTotalHt(br);

        Table totaux = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(20);

        totaux.addCell(new Cell().setBorder(Border.NO_BORDER));

        Table rightBlock = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100)).setBorder(Border.NO_BORDER);

        addTotalRow(rightBlock, "Total HT", fmt(totalHt) + " MAD", regular);

        rightBlock.addCell(new Cell(1, 2)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(COLOR_PRIMARY, 1.5f))
                .setPaddingBottom(4));

        Cell htLabel = new Cell().setBackgroundColor(COLOR_PRIMARY)
                .setBorder(Border.NO_BORDER).setPadding(8);
        htLabel.add(new Paragraph("TOTAL REÇU HT")
                .setFont(bold).setFontSize(10).setFontColor(COLOR_WHITE));
        rightBlock.addCell(htLabel);

        Cell htValue = new Cell().setBackgroundColor(COLOR_PRIMARY)
                .setBorder(Border.NO_BORDER).setPadding(8).setTextAlignment(TextAlignment.RIGHT);
        htValue.add(new Paragraph(fmt(totalHt) + " MAD")
                .setFont(bold).setFontSize(11).setFontColor(COLOR_WHITE));
        rightBlock.addCell(htValue);

        totaux.addCell(new Cell().setBorder(Border.NO_BORDER).add(rightBlock));
        document.add(totaux);

        // ─────────────────────────────────────────────────────────────
        // 5. OBSERVATIONS
        // ─────────────────────────────────────────────────────────────
        if (br.getObservations() != null && !br.getObservations().isBlank()) {
            document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(8));
            document.add(new Paragraph("Observations")
                    .setFont(bold).setFontSize(10).setFontColor(COLOR_PRIMARY).setMarginBottom(4));
            document.add(new Paragraph(br.getObservations())
                    .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(14));
        }

        // ─────────────────────────────────────────────────────────────
        // 6. SIGNATURE (Magasinier + Fournisseur)
        // ─────────────────────────────────────────────────────────────
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(12));

        Table signature = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(20);

        Cell sigMagasinier = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
        sigMagasinier.add(new Paragraph("Réceptionné par — Magasinier")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(40));
        sigMagasinier.add(new Paragraph("Signature & cachet : ___________________________")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        signature.addCell(sigMagasinier);

        Cell sigFournisseur = new Cell().setBorder(Border.NO_BORDER).setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT);
        sigFournisseur.add(new Paragraph("Livré par — Fournisseur")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(40));
        sigFournisseur.add(new Paragraph("Signature & cachet : ___________________________")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        signature.addCell(sigFournisseur);

        document.add(signature);

        // ─────────────────────────────────────────────────────────────
        // 7. CONDITIONS GÉNÉRALES
        // ─────────────────────────────────────────────────────────────
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(6));
        document.add(new Paragraph("Conditions générales")
                .setFont(bold).setFontSize(8).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(2));
        document.add(new Paragraph(
                "Ce bon de réception atteste de la livraison effective des marchandises par le fournisseur. " +
                "Toute non-conformité doit être signalée dans les 48 heures. " +
                "Prix exprimés en dirhams marocains (MAD) hors taxes.")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));

        // ─────────────────────────────────────────────────────────────
        // 8. PIED DE PAGE
        // ─────────────────────────────────────────────────────────────
        document.add(new Paragraph(" ").setMarginTop(16));
        Table footer = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(COLOR_HEADER_BG)
                .setBorder(Border.NO_BORDER);

        Cell fl = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
        fl.add(new Paragraph("Votre Société SARL  –  RC 123456  –  ICE 001234567000056")
                .setFont(regular).setFontSize(7).setFontColor(COLOR_TEXT_MUTED));
        footer.addCell(fl);

        Cell fr = new Cell().setBorder(Border.NO_BORDER).setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT);
        fr.add(new Paragraph("Merci pour votre collaboration !")
                .setFont(bold).setFontSize(8).setFontColor(COLOR_PRIMARY));
        footer.addCell(fr);

        document.add(footer);
        document.close();
        return baos.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private BigDecimal calcTotalHt(BonReceptionFournisseurDTO br) {
        if (br.getDetails() == null) return BigDecimal.ZERO;
        return br.getDetails().stream()
                .map(d -> d.getMontant() != null ? d.getMontant() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * ✅ FIX : accepte Object pour gérer Integer, Long, Double ou BigDecimal
     * selon le type réel du champ qte dans le DTO.
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Integer i)    return BigDecimal.valueOf(i);
        if (value instanceof Long l)       return BigDecimal.valueOf(l);
        if (value instanceof Double d)     return BigDecimal.valueOf(d);
        return new BigDecimal(value.toString());
    }

    private void addHeaderCell(Table t, String text, PdfFont font, TextAlignment align) {
        Cell cell = new Cell()
                .setBackgroundColor(COLOR_PRIMARY)
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(7).setPaddingBottom(7)
                .setPaddingLeft(7).setPaddingRight(7);
        cell.add(new Paragraph(text).setFont(font).setFontSize(9)
                .setFontColor(COLOR_WHITE).setTextAlignment(align));
        t.addCell(cell);
    }

    private void addDataCell(Table t, String text, PdfFont font, float size,
                              TextAlignment align, DeviceRgb bg) {
        Cell cell = new Cell()
                .setBackgroundColor(bg)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(COLOR_SEPARATOR, 0.5f))
                .setPaddingTop(6).setPaddingBottom(6)
                .setPaddingLeft(7).setPaddingRight(7);
        cell.add(new Paragraph(safe(text)).setFont(font).setFontSize(size).setTextAlignment(align));
        t.addCell(cell);
    }

    private void addTotalRow(Table t, String label, String value, PdfFont font) {
        Cell lc = new Cell().setBorder(Border.NO_BORDER).setPadding(5);
        lc.add(new Paragraph(label).setFont(font).setFontSize(9).setFontColor(COLOR_TEXT_MUTED));
        t.addCell(lc);

        Cell vc = new Cell().setBorder(Border.NO_BORDER).setPadding(5)
                .setTextAlignment(TextAlignment.RIGHT);
        vc.add(new Paragraph(value).setFont(font).setFontSize(9));
        t.addCell(vc);
    }

    private String formatStatut(BonReceptionFournisseur.Statut statut) {
        if (statut == null) return "";
        return switch (statut) {
            case en_cours -> "● EN COURS";
            case recu     -> "✓ REÇU";
            case facture  -> "✓ FACTURÉ";
            case annule   -> "✗ ANNULÉ";
        };
    }

    private DeviceRgb statusColor(BonReceptionFournisseur.Statut statut) {
        if (statut == null) return COLOR_TEXT_MUTED;
        return switch (statut) {
            case en_cours -> COLOR_ORANGE;
            case recu     -> COLOR_GREEN;
            case facture  -> COLOR_PRIMARY;
            case annule   -> new DeviceRgb(211, 47, 47);
        };
    }

    private String fmt(BigDecimal v) {
        if (v == null) return "0,00";
        return String.format("%,.2f", v)
                .replace(",", "TEMP").replace(".", ",").replace("TEMP", " ");
    }

    private String fmtQte(BigDecimal v) {
        if (v == null) return "0";
        return v.stripTrailingZeros().toPlainString();
    }

    private String fmtDate(LocalDate d) {
        return d != null ? d.format(FMT) : "-";
    }

    private String safe(String s) { return s != null ? s : ""; }
}