package com.gestion.commerciale.dto.assistant;

import lombok.*;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IntentResultDTO {
    private String intent;
    private Map<String, Object> params;
}