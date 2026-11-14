package com.gestion.commerciale.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class GlobalSearchResultDTO {
    private String type;
    private Integer id;
    private String title;
    private String subtitle;
    private String path;
    private String icon;
}
