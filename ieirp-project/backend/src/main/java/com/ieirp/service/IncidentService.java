package com.ieirp.service;

import com.ieirp.model.Incident;
import com.ieirp.model.Incident.IncidentStatus;
import com.ieirp.model.User;
import com.ieirp.repository.CategoryRepository;
import com.ieirp.repository.IncidentRepository;
import com.ieirp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {
    private static final String PUBLIC_REPORTER_EMAIL = "public-reporter@ieirp.local";
    
    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public Incident createIncident(Incident incident) {
        validateIncidentDetails(incident);
        incident.setCategory(categoryRepository.findById(incident.getCategory().getId())
                .orElseThrow(() -> new RuntimeException("Category not found")));
        if (incident.getUser() != null && (incident.getReporterEmail() == null || incident.getReporterEmail().isBlank())) {
            incident.setReporterEmail(incident.getUser().getEmail());
        }
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setArchived(false);
        incident.setArchivedAt(null);
        incident.setCreatedAt(LocalDateTime.now());
        return incidentRepository.save(incident);
    }

    public Incident createPublicIncident(Incident incident) {
        validateReporterEmail(incident.getReporterEmail());
        incident.setUser(getPublicReporterUser());
        return createIncident(incident);
    }
    
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }
    
    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }
    
    public List<Incident> getIncidentsByUser(User user) {
        return incidentRepository.findActiveByUser(user);
    }
    
    public List<Incident> getIncidentsByStatus(IncidentStatus status) {
        return incidentRepository.findByStatus(status);
    }
    
    public List<Incident> getIncidentsByCategory(Long categoryId) {
        return incidentRepository.findByCategoryId(categoryId);
    }
    
    public List<Incident> getIncidentsWithFilters(IncidentStatus status, Long categoryId, 
                                               LocalDateTime startDate, LocalDateTime endDate) {
        return getIncidentsWithFilters(status, categoryId, startDate, endDate, false);
    }

    public List<Incident> getIncidentsWithFilters(IncidentStatus status, Long categoryId, 
                                               LocalDateTime startDate, LocalDateTime endDate, Boolean archived) {
        return incidentRepository.findIncidentsWithFilters(status, categoryId, startDate, endDate, archived);
    }
    
    public Incident updateIncidentStatus(Long id, IncidentStatus status) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (status == null) {
            throw new RuntimeException("Status is required");
        }
        
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());
        
        if (status == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
        } else {
            incident.setResolvedAt(null);
            incident.setArchived(false);
            incident.setArchivedAt(null);
        }
        
        return incidentRepository.save(incident);
    }

    public Incident archiveIncident(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        if (incident.getStatus() != IncidentStatus.RESOLVED) {
            throw new RuntimeException("Only resolved incidents can be archived");
        }
        incident.setArchived(true);
        incident.setArchivedAt(LocalDateTime.now());
        incident.setUpdatedAt(LocalDateTime.now());
        return incidentRepository.save(incident);
    }

    public Incident unarchiveIncident(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setArchived(false);
        incident.setArchivedAt(null);
        incident.setUpdatedAt(LocalDateTime.now());
        return incidentRepository.save(incident);
    }
    
    public Incident updateIncident(Long id, Incident incidentDetails) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        validateIncidentDetails(incidentDetails);
        
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
        return incidentRepository.countActiveByStatus(status);
    }

    public long getActiveIncidentCount() {
        return incidentRepository.countActiveIncidents();
    }

    public long getArchivedIncidentCount() {
        return incidentRepository.countArchivedIncidents();
    }

    private void validateIncidentDetails(Incident incident) {
        if (incident.getCategory() == null || incident.getCategory().getId() == null) {
            throw new RuntimeException("Category is required");
        }
        if (incident.getLocation() == null || incident.getLocation().isBlank()) {
            throw new RuntimeException("Location is required");
        }
        if (incident.getLatitude() != null && (incident.getLatitude() < -90 || incident.getLatitude() > 90)) {
            throw new RuntimeException("Latitude must be between -90 and 90");
        }
        if (incident.getLongitude() != null && (incident.getLongitude() < -180 || incident.getLongitude() > 180)) {
            throw new RuntimeException("Longitude must be between -180 and 180");
        }
        validateImageUrl(incident.getImageUrl());
    }

    private void validateReporterEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Reporter email is required");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException("Reporter email should be valid");
        }
    }

    private User getPublicReporterUser() {
        return userRepository.findByEmail(PUBLIC_REPORTER_EMAIL)
                .orElseGet(() -> {
                    User user = new User();
                    user.setName("Public Emergency Reporter");
                    user.setEmail(PUBLIC_REPORTER_EMAIL);
                    user.setPassword(passwordEncoder.encode("public-reporter-disabled"));
                    user.setRole(User.Role.CITIZEN);
                    return userRepository.save(user);
                });
    }

    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        if (imageUrl.length() > 3_000_000) {
            throw new RuntimeException("Image is too large. Please upload an image under 2 MB.");
        }
        boolean dataImage = imageUrl.matches("^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\\r\\n]+$");
        boolean remoteImage = imageUrl.matches("^https?://.{1,2048}$");
        if (!dataImage && !remoteImage) {
            throw new RuntimeException("Image must be a PNG, JPG, WEBP, GIF, or a valid image URL.");
        }
    }
}
