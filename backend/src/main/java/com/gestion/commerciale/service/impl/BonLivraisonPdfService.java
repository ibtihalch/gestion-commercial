package com.gestion.commerciale.service.impl;

import com.gestion.commerciale.dto.BonLivraisonDTO;
import com.gestion.commerciale.entity.BonLivraison;
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
public class BonLivraisonPdfService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Palette — vert teal pour différencier visuellement le BL du BCC (bleu)
    private static final DeviceRgb COLOR_PRIMARY     = new DeviceRgb(0,   137, 123); // teal-700
    private static final DeviceRgb COLOR_PRIMARY_BG  = new DeviceRgb(224, 242, 241); // teal-50
    private static final DeviceRgb COLOR_HEADER_BG   = new DeviceRgb(245, 245, 245);
    private static final DeviceRgb COLOR_TEXT_MUTED  = new DeviceRgb(117, 117, 117);
    private static final DeviceRgb COLOR_WHITE       = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb COLOR_ROW_ALT     = new DeviceRgb(248, 249, 250);
    private static final DeviceRgb COLOR_SEPARATOR   = new DeviceRgb(220, 220, 220);
    private static final DeviceRgb COLOR_ORANGE      = new DeviceRgb(245, 158, 11);
    private static final DeviceRgb COLOR_ORANGE_BG   = new DeviceRgb(255, 251, 235);
    private static final DeviceRgb COLOR_GREEN       = new DeviceRgb(46,  125,  50);
    private static final DeviceRgb COLOR_GREEN_BG    = new DeviceRgb(232, 245, 233);

    public byte[] generatePdf(BonLivraisonDTO bl) throws IOException {

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

        // Colonne gauche — société
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

        // Colonne droite — référence BL
        Cell refCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        refCell.add(new Paragraph("BON DE LIVRAISON")
                .setFont(bold).setFontSize(18).setFontColor(COLOR_PRIMARY).setMarginBottom(2));
        refCell.add(new Paragraph("N°  " + safe(bl.getNumero()))
                .setFont(bold).setFontSize(12).setFontColor(COLOR_PRIMARY));
        refCell.add(new Paragraph("Date de livraison : " + fmtDate(bl.getDateLivraison()))
                .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED));
        if (bl.getDateCreation() != null) {
            refCell.add(new Paragraph("Créé le : " + bl.getDateCreation()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED));
        }
        // Badge statut
        refCell.add(new Paragraph(formatStatut(bl.getStatut()))
                .setFont(bold).setFontSize(9).setFontColor(statusColor(bl.getStatut()))
                .setMarginTop(4));
        header.addCell(refCell);

        document.add(header);
        document.add(new LineSeparator(new SolidLine(1f)).setMarginTop(10).setMarginBottom(14));

        // ─────────────────────────────────────────────────────────────
        // 2. BLOC CLIENT + AFFAIRE / BCC lié
        // ─────────────────────────────────────────────────────────────
        Table clientTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(18);

        // Client
        Cell clientCell = new Cell()
                .setBackgroundColor(COLOR_PRIMARY_BG)
                .setBorder(new SolidBorder(COLOR_PRIMARY, 1f))
                .setBorderRadius(new BorderRadius(4))
                .setPadding(10);
        clientCell.add(new Paragraph("CLIENT")
                .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                .setCharacterSpacing(1).setMarginBottom(4));
        clientCell.add(new Paragraph(safe(bl.getClientNom()))
                .setFont(bold).setFontSize(13).setFontColor(COLOR_PRIMARY));
        clientTable.addCell(clientCell);

        // Affaire ou BCC lié (colonne droite)
        Cell rightInfoCell;
        if (bl.getAffaireNom() != null) {
            rightInfoCell = new Cell()
                    .setBackgroundColor(COLOR_ORANGE_BG)
                    .setBorder(new SolidBorder(COLOR_ORANGE, 1f))
                    .setBorderRadius(new BorderRadius(4))
                    .setPadding(10)
                    .setMarginLeft(8);
            rightInfoCell.add(new Paragraph("AFFAIRE")
                    .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                    .setCharacterSpacing(1).setMarginBottom(4));
            rightInfoCell.add(new Paragraph(safe(bl.getAffaireNom()))
                    .setFont(bold).setFontSize(13).setFontColor(COLOR_ORANGE));
        } else if (bl.getBonCommandeClientId() != null) {
            rightInfoCell = new Cell()
                    .setBackgroundColor(COLOR_GREEN_BG)
                    .setBorder(new SolidBorder(COLOR_GREEN, 1f))
                    .setBorderRadius(new BorderRadius(4))
                    .setPadding(10)
                    .setMarginLeft(8);
            rightInfoCell.add(new Paragraph("BON DE COMMANDE LIÉ")
                    .setFont(bold).setFontSize(7).setFontColor(COLOR_TEXT_MUTED)
                    .setCharacterSpacing(1).setMarginBottom(4));
            rightInfoCell.add(new Paragraph("BCC N° " + bl.getBonCommandeClientId())
                    .setFont(bold).setFontSize(13).setFontColor(COLOR_GREEN));
        } else {
            rightInfoCell = new Cell().setBorder(Border.NO_BORDER);
        }
        clientTable.addCell(rightInfoCell);
        document.add(clientTable);

        // ─────────────────────────────────────────────────────────────
        // 3. TABLEAU DES LIGNES
        // ─────────────────────────────────────────────────────────────
        Table lignes = new Table(UnitValue.createPercentArray(new float[]{8f, 44f, 10f, 19f, 19f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(6);

        addHeaderCell(lignes, "#",                bold, TextAlignment.CENTER);
        addHeaderCell(lignes, "Désignation",      bold, TextAlignment.LEFT);
        addHeaderCell(lignes, "Qté",              bold, TextAlignment.CENTER);
        addHeaderCell(lignes, "Prix unitaire HT", bold, TextAlignment.RIGHT);
        addHeaderCell(lignes, "Montant HT",       bold, TextAlignment.RIGHT);

        if (bl.getDetails() != null) {
            int n = 1;
            for (BonLivraisonDTO.DetailDTO det : bl.getDetails()) {
                DeviceRgb bg = (n % 2 == 0) ? COLOR_ROW_ALT : COLOR_WHITE;
                String designation = safe(det.getArticleCode())
                        + (det.getArticleDesignation() != null
                            ? " – " + det.getArticleDesignation() : "");

                addDataCell(lignes, String.valueOf(n),                   regular, 8,  TextAlignment.CENTER, bg);
                addDataCell(lignes, designation,                         regular, 9,  TextAlignment.LEFT,   bg);
                addDataCell(lignes, fmtQte(det.getQte()),                regular, 9,  TextAlignment.CENTER, bg);
                addDataCell(lignes, fmt(det.getPrixUnitaire()) + " MAD", regular, 9,  TextAlignment.RIGHT,  bg);
                addDataCell(lignes, fmt(det.getMontant())      + " MAD", bold,    9,  TextAlignment.RIGHT,  bg);
                n++;
            }
        }
        document.add(lignes);

        // ─────────────────────────────────────────────────────────────
        // 4. TOTAUX
        // ─────────────────────────────────────────────────────────────
        BigDecimal ht  = nvl(bl.getMontantHt());
        BigDecimal tva = nvl(bl.getTva());
        BigDecimal ttc = nvl(bl.getMontantTtc());

        Table totaux = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(20);

        totaux.addCell(new Cell().setBorder(Border.NO_BORDER));

        Table rightBlock = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100)).setBorder(Border.NO_BORDER);

        addTotalRow(rightBlock, "Total HT", fmt(ht)  + " MAD", regular);
        addTotalRow(rightBlock, "TVA 20%",  fmt(tva) + " MAD", regular);

        rightBlock.addCell(new Cell(1, 2)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(COLOR_PRIMARY, 1.5f))
                .setPaddingBottom(4));

        Cell ttcLabel = new Cell().setBackgroundColor(COLOR_PRIMARY)
                .setBorder(Border.NO_BORDER).setPadding(8);
        ttcLabel.add(new Paragraph("TOTAL TTC")
                .setFont(bold).setFontSize(10).setFontColor(COLOR_WHITE));
        rightBlock.addCell(ttcLabel);

        Cell ttcValue = new Cell().setBackgroundColor(COLOR_PRIMARY)
                .setBorder(Border.NO_BORDER).setPadding(8).setTextAlignment(TextAlignment.RIGHT);
        ttcValue.add(new Paragraph(fmt(ttc) + " MAD")
                .setFont(bold).setFontSize(11).setFontColor(COLOR_WHITE));
        rightBlock.addCell(ttcValue);

        totaux.addCell(new Cell().setBorder(Border.NO_BORDER).add(rightBlock));
        document.add(totaux);

        // ─────────────────────────────────────────────────────────────
        // 5. OBSERVATIONS
        // ─────────────────────────────────────────────────────────────
        if (bl.getObservations() != null && !bl.getObservations().isBlank()) {
            document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(8));
            document.add(new Paragraph("Observations")
                    .setFont(bold).setFontSize(10).setFontColor(COLOR_PRIMARY).setMarginBottom(4));
            document.add(new Paragraph(bl.getObservations())
                    .setFont(regular).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(14));
        }

        // ─────────────────────────────────────────────────────────────
        // 6. SIGNATURE
        // ─────────────────────────────────────────────────────────────
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(12));

        Table signature = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(20);

        Cell sigClient = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
        sigClient.add(new Paragraph("Réceptionné par — Client")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(40));
        sigClient.add(new Paragraph("Signature & cachet : ___________________________")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        signature.addCell(sigClient);

        Cell sigSociete = new Cell().setBorder(Border.NO_BORDER).setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT);
        sigSociete.add(new Paragraph("Livré par")
                .setFont(bold).setFontSize(9).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(40));
        sigSociete.add(new Paragraph("Signature & cachet : ___________________________")
                .setFont(regular).setFontSize(8).setFontColor(COLOR_TEXT_MUTED));
        signature.addCell(sigSociete);

        document.add(signature);

        // ─────────────────────────────────────────────────────────────
        // 7. CONDITIONS GÉNÉRALES
        // ─────────────────────────────────────────────────────────────
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginBottom(6));
        document.add(new Paragraph("Conditions générales")
                .setFont(bold).setFontSize(8).setFontColor(COLOR_TEXT_MUTED).setMarginBottom(2));
        document.add(new Paragraph(
                "Ce bon de livraison atteste de la remise effective des marchandises au client. " +
                "Toute réserve doit être émise par écrit dans les 48 heures. " +
                "Prix exprimés en dirhams marocains (MAD) HT, TVA 20% en sus.")
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
        fr.add(new Paragraph("Merci pour votre confiance !")
                .setFont(bold).setFontSize(8).setFontColor(COLOR_PRIMARY));
        footer.addCell(fr);

        document.add(footer);
        document.close();
        return baos.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

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

    private String formatStatut(BonLivraison.Statut statut) {
        if (statut == null) return "";
        return switch (statut) {
            case en_cours -> "● EN COURS";
            case livre    -> "✓ LIVRÉ";
            case facture  -> "✓ FACTURÉ";
            case annule   -> "✗ ANNULÉ";
    };
    }

    private DeviceRgb statusColor(BonLivraison.Statut statut) {
        if (statut == null) return COLOR_TEXT_MUTED;
        return switch (statut) {
            case en_cours -> COLOR_ORANGE;
            case livre    -> COLOR_GREEN;
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

    private String safe(String s)      { return s != null ? s : ""; }
    private BigDecimal nvl(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
}