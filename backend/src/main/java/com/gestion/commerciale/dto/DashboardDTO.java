package com.gestion.commerciale.dto;

import lombok.*;

import java.math.BigDecimal;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class DashboardDTO {
    private long totalClients;
    private long totalFournisseurs;
    private long totalArticles;
    private long totalDevis;
    private long articlesAlerteStock;
    private BigDecimal chiffreAffaires;
    private BigDecimal facturesImpayees;
    private BigDecimal facturesPayees;
    private BigDecimal totalCommandesClient;
}
