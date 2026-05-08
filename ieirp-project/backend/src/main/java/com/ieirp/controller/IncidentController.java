package com.ieirp.controller;

import com.ieirp.model.Incident;
import com.ieirp.model.Incident.IncidentStatus;
import com.ieirp.model.User;
import com.ieirp.service.IncidentService;
import com.ieirp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {
    
    @Autowired
    private IncidentService incidentService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('CITIZEN', 'AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> createIncident(@RequestBody Incident incident, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            incident.setUser(user);
            Incident createdIncident = incidentService.createIncident(incident);
            
            return ResponseEntity.ok(createdIncident);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/public")
    public ResponseEntity<?> createPublicIncident(@RequestBody Incident incident) {
        try {
            Incident createdIncident = incidentService.createPublicIncident(incident);
            return ResponseEntity.ok(Map.of(
                    "message", "Incident reported successfully",
                    "incidentId", createdIncident.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<List<Incident>> getAllIncidents() {
        List<Incident> incidents = incidentService.getAllIncidents();
        return ResponseEntity.ok(incidents);
    }
    
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CITIZEN', 'AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> getMyIncidents(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Incident> incidents = incidentService.getIncidentsByUser(user);
            return ResponseEntity.ok(incidents);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> getIncidentById(@PathVariable Long id, Authentication authentication) {
        try {
            Optional<Incident> incident = incidentService.getIncidentById(id);
            
            if (incident.isPresent()) {
                // Citizens can only view their own incidents
                if (authentication.getAuthorities().stream()
                        .anyMatch(auth -> auth.getAuthority().equals("ROLE_CITIZEN"))) {
                    
                    String email = authentication.getName();
                    User user = userService.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    
                    if (incident.get().getUser() == null || !incident.get().getUser().getId().equals(user.getId())) {
                        return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                    }
                }
                
                return ResponseEntity.ok(incident.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> updateIncidentStatus(@PathVariable Long id, 
                                               @RequestBody Map<String, String> statusUpdate) {
        try {
            String statusStr = statusUpdate.get("status");
            IncidentStatus status = IncidentStatus.valueOf(statusStr.toUpperCase());
            
            Incident updatedIncident = incidentService.updateIncidentStatus(id, status);
            return ResponseEntity.ok(updatedIncident);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> filterIncidents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "false") Boolean archived) {
        
        try {
            IncidentStatus incidentStatus = status != null ? 
                IncidentStatus.valueOf(status.toUpperCase()) : null;
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
            
            List<Incident> incidents = incidentService.getIncidentsWithFilters(
                incidentStatus, categoryId, start, end, archived);
            
            return ResponseEntity.ok(incidents);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> getIncidentStats() {
        try {
            Map<String, Long> stats = Map.of(
                "active", incidentService.getActiveIncidentCount(),
                "reported", incidentService.getIncidentCountByStatus(IncidentStatus.REPORTED),
                "underReview", incidentService.getIncidentCountByStatus(IncidentStatus.UNDER_REVIEW),
                "inProgress", incidentService.getIncidentCountByStatus(IncidentStatus.IN_PROGRESS),
                "resolved", incidentService.getIncidentCountByStatus(IncidentStatus.RESOLVED),
                "rejected", incidentService.getIncidentCountByStatus(IncidentStatus.REJECTED),
                "archived", incidentService.getArchivedIncidentCount()
            );
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> archiveIncident(@PathVariable Long id) {
        try {
            Incident archivedIncident = incidentService.archiveIncident(id);
            return ResponseEntity.ok(archivedIncident);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'ADMIN')")
    public ResponseEntity<?> unarchiveIncident(@PathVariable Long id) {
        try {
            Incident incident = incidentService.unarchiveIncident(id);
            return ResponseEntity.ok(incident);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteIncident(@PathVariable Long id) {
        try {
            incidentService.deleteIncident(id);
            return ResponseEntity.ok(Map.of("message", "Incident deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
