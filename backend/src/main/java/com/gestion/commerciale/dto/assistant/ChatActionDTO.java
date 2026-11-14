package com.gestion.commerciale.dto.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatActionDTO {
    private String label;
    private String path;
    private String icon;
}
