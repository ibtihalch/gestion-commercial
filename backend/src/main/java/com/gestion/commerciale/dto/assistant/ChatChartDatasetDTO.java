package com.gestion.commerciale.dto.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatChartDatasetDTO {
    private String label;
    private String color;
    private List<BigDecimal> values;
}
