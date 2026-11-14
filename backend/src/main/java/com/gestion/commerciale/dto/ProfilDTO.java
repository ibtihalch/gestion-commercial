package com.gestion.commerciale.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilDTO {
    private Integer id;
    private String img;
    private String poste;
    private String bio;
    private String signature;
}