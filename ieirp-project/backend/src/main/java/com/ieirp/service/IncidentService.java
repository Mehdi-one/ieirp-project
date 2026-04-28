package com.ieirp.service;

import com.ieirp.model.Incident;
import com.ieirp.model.Incident.IncidentStatus;
import com.ieirp.model.User;
import com.ieirp.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    public Incident createIncident(Incident incident) {
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setCreatedAt(LocalDateTime.now());
        return incidentRepository.save(incident);
    }
    
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }
    
    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }
    
    public List<Incident> getIncidentsByUser(User user) {
        return incidentRepository.findByUser(user);
    }
    
    public List<Incident> getIncidentsByStatus(IncidentStatus status) {
        return incidentRepository.findByStatus(status);
    }
    
    public List<Incident> getIncidentsByCategory(Long categoryId) {
        return incidentRepository.findByCategoryId(categoryId);
    }
    
    public List<Incident> getIncidentsWithFilters(IncidentStatus status, Long categoryId, 
                                               LocalDateTime startDate, LocalDateTime endDate) {
        return incidentRepository.findIncidentsWithFilters(status, categoryId, startDate, endDate);
    }
    
    public Incident updateIncidentStatus(Long id, IncidentStatus status) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());
        
        if (status == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
        }
        
        return incidentRepository.save(incident);
    }
    
    public Incident updateIncident(Long id, Incident incidentDetails) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        
        incident.setLocation(incidentDetails.getLocation());
        incident.setDescription(incidentDetails.getDescription());
        incident.setImageUrl(incidentDetails.getImageUrl());
        incident.setLatitude(incidentDetails.getLatitude());
        incident.setLongitude(incidentDetails.getLongitude());
        incident.setUpdatedAt(LocalDateTime.now());
        
        return incidentRepository.save(incident);
    }
    
    public void deleteIncident(Long id) {
        if (!incidentRepository.existsById(id)) {
            throw new RuntimeException("Incident not found");
        }
        incidentRepository.deleteById(id);
    }
    
    public long getIncidentCountByStatus(IncidentStatus status) {
        return incidentRepository.countByStatus(status);
    }
}
