package com.ieirp.config;

import com.ieirp.model.Category;
import com.ieirp.model.Incident;
import com.ieirp.model.User;
import com.ieirp.repository.IncidentRepository;
import com.ieirp.repository.UserRepository;
import com.ieirp.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private CategoryService categoryService;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Initialize categories if they don't exist
        initializeCategories();
        
        initializeDefaultUsers();

        initializeSeedIncidents();
    }
    
    private void initializeCategories() {
        String[] categoryNames = {
            "Forest Fire",
            "Snow-blocked Road", 
            "Water Issue",
            "Infrastructure Damage",
            "Wildlife Incident",
            "Air Pollution",
            "Waste Management",
            "Noise Pollution"
        };
        
        String[] categoryDescriptions = {
            "Reports related to forest fires and wildfire incidents",
            "Roads blocked due to snow or ice accumulation",
            "Water contamination, shortage, or flooding issues",
            "Damage to roads, buildings, bridges, and other infrastructure",
            "Injured wildlife, animal sightings in urban areas",
            "Air quality issues and pollution incidents",
            "Illegal dumping, waste collection issues",
            "Excessive noise from construction, traffic, or other sources"
        };
        
        for (int i = 0; i < categoryNames.length; i++) {
            if (!categoryService.getCategoryByName(categoryNames[i]).isPresent()) {
                Category category = new Category(categoryNames[i], categoryDescriptions[i]);
                categoryService.createCategory(category);
            }
        }
    }
    
    private void initializeDefaultUsers() {
        upsertDefaultUser("System Administrator", "admin@ieirp.com", "admin123", User.Role.ADMIN);
        upsertDefaultUser("Authority User", "authority@ieirp.com", "password123", User.Role.AUTHORITY);
    }

    private void upsertDefaultUser(String name, String email, String rawPassword, User.Role role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        userRepository.save(user);
    }

    private void initializeSeedIncidents() {
        if (incidentRepository.count() > 0) {
            return;
        }

        User authority = userRepository.findByEmail("authority@ieirp.com").orElse(null);
        User admin = userRepository.findByEmail("admin@ieirp.com").orElse(null);
        if (authority == null || admin == null) {
            return;
        }

        List<Incident> incidents = new ArrayList<>();
        incidents.add(seedIncident("Forest Fire", authority, "Cedar forest trailhead",
                "Smoke reported near the cedar forest picnic area after an unattended campfire.",
                Incident.IncidentStatus.REPORTED, 33.5500, -5.2100, 2));
        incidents.add(seedIncident("Snow-blocked Road", authority, "Azrou road area",
                "Snow buildup is slowing traffic on the road toward Azrou and needs clearing.",
                Incident.IncidentStatus.IN_PROGRESS, 33.5410, -5.1820, 5));
        incidents.add(seedIncident("Water Issue", admin, "Oued Tizguit river",
                "Residents noticed cloudy water and unusual odor near the river crossing.",
                Incident.IncidentStatus.UNDER_REVIEW, 33.5250, -5.1750, 8));
        incidents.add(seedIncident("Infrastructure Damage", authority, "University gate",
                "Broken sidewalk slabs near the university gate are blocking pedestrian access.",
                Incident.IncidentStatus.REPORTED, 33.5280, -5.1590, 10));
        incidents.add(seedIncident("Wildlife Incident", admin, "Cedar forest",
                "Injured Barbary macaque seen close to the roadside and needs wildlife support.",
                Incident.IncidentStatus.IN_PROGRESS, 33.5500, -5.2100, 13));
        incidents.add(seedIncident("Air Pollution", authority, "Eastern district",
                "Strong smoke from open burning has reduced visibility in nearby streets.",
                Incident.IncidentStatus.REJECTED, 33.5370, -5.1480, 16));
        incidents.add(seedIncident("Waste Management", admin, "Market area",
                "Overflowing waste containers behind the market are attracting pests.",
                Incident.IncidentStatus.REPORTED, 33.5315, -5.1702, 18));
        incidents.add(seedIncident("Noise Pollution", authority, "Hay Riad neighborhood",
                "Late-night construction noise has continued after permitted hours.",
                Incident.IncidentStatus.UNDER_REVIEW, 33.5290, -5.1630, 21));
        incidents.add(seedIncident("Forest Fire", admin, "Center Ifrane",
                "Small grass fire reported near a public garden and contained by residents.",
                Incident.IncidentStatus.RESOLVED, 33.5333, -5.1667, 24));
        incidents.add(seedIncident("Water Issue", authority, "Hay Riad neighborhood",
                "Leaking water line is flooding a residential street and wasting clean water.",
                Incident.IncidentStatus.IN_PROGRESS, 33.5290, -5.1630, 27));
        incidents.add(seedIncident("Infrastructure Damage", admin, "Market area",
                "Damaged storm drain cover creates a hazard for pedestrians and vehicles.",
                Incident.IncidentStatus.REPORTED, 33.5315, -5.1702, 30));
        incidents.add(seedIncident("Snow-blocked Road", authority, "University gate",
                "Icy patches near the campus entrance caused several minor vehicle skids.",
                Incident.IncidentStatus.RESOLVED, 33.5280, -5.1590, 33));
        incidents.add(seedIncident("Waste Management", admin, "Eastern district",
                "Illegal dumping of construction debris reported beside an empty lot.",
                Incident.IncidentStatus.UNDER_REVIEW, 33.5370, -5.1480, 36));
        incidents.add(seedIncident("Air Pollution", authority, "Azrou road area",
                "Dust from roadside work is affecting pedestrians and nearby homes.",
                Incident.IncidentStatus.REPORTED, 33.5410, -5.1820, 40));
        incidents.add(seedIncident("Wildlife Incident", admin, "Oued Tizguit river",
                "Stray dogs are disturbing nesting birds along the river path.",
                Incident.IncidentStatus.REJECTED, 33.5250, -5.1750, 44));
        incidents.add(seedIncident("Noise Pollution", authority, "Center Ifrane",
                "Repeated vehicle horn noise and loud music reported near the central square.",
                Incident.IncidentStatus.RESOLVED, 33.5333, -5.1667, 48));

        incidentRepository.saveAll(incidents);
    }

    private Incident seedIncident(
            String categoryName,
            User user,
            String location,
            String description,
            Incident.IncidentStatus status,
            double latitude,
            double longitude,
            int hoursAgo
    ) {
        Category category = categoryService.getCategoryByName(categoryName)
                .orElseThrow(() -> new IllegalStateException("Missing category: " + categoryName));
        Incident incident = new Incident(category, user, location, description);
        incident.setStatus(status);
        incident.setLatitude(latitude);
        incident.setLongitude(longitude);
        incident.setReporterEmail(user.getEmail());
        incident.setCreatedAt(LocalDateTime.now().minusHours(hoursAgo));
        incident.setUpdatedAt(LocalDateTime.now().minusHours(Math.max(hoursAgo - 1, 0)));
        if (status == Incident.IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now().minusHours(Math.max(hoursAgo - 2, 0)));
        }
        return incident;
    }
}
