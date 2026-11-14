package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUtilisateurIdAndResolueFalseOrderByDateCreationDesc(Integer utilisateurId, Pageable pageable);
    long countByUtilisateurIdAndLueFalseAndResolueFalse(Integer utilisateurId);
    Optional<Notification> findByDedupeKey(String dedupeKey);
    List<Notification> findByUtilisateurIdAndLueFalseAndResolueFalse(Integer utilisateurId);
    List<Notification> findByUtilisateurIdAndResolueFalse(Integer utilisateurId);
}
