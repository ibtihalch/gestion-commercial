package com.gestion.commerciale.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationDTO {
    private Integer id;
    private String categorie;
    private String titre;
    private String message;
    private String niveau;
    private String path;
    private Boolean lue;
    private Boolean resolue;
    private LocalDateTime dateCreation;
}
