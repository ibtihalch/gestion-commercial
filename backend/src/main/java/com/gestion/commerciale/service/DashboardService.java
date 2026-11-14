package com.gestion.commerciale.service;

import com.gestion.commerciale.dto.DashboardDTO;

import java.util.List;
import java.util.Map;

public interface DashboardService {
    DashboardDTO getStats(Integer entrepriseId);
    List<Map<String, Object>> getCaMensuel(Integer entrepriseId, int annee);
}