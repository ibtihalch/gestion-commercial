package com.gestion.commerciale.dto.assistant;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatResponseDTO {
    private String reply;
    private String intent;
    private List<ChatActionDTO> actions;
    private ChatChartDTO chart;
}
