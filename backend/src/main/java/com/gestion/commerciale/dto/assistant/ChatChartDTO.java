package com.gestion.commerciale.dto.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatChartDTO {
    private String type;
    private String title;
    private String unit;
    private List<String> labels;
    private List<ChatChartDatasetDTO> datasets;
}
