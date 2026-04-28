package com.ieirp.config;

import com.ieirp.model.Category;
import com.ieirp.model.User;
import com.ieirp.service.CategoryService;
import com.ieirp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private CategoryService categoryService;
    
    @Autowired
    private UserService userService;
    
    @Override
    public void run(String... args) throws Exception {
        // Initialize categories if they don't exist
        initializeCategories();
        
        // Initialize admin user if it doesn't exist
        initializeAdminUser();
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
    
    private void initializeAdminUser() {
        if (!userService.findByEmail("admin@ieirp.com").isPresent()) {
            User admin = new User();
            admin.setName("System Administrator");
            admin.setEmail("admin@ieirp.com");
            admin.setPassword("admin123");
            admin.setRole(User.Role.ADMIN);
            
            userService.registerUser(admin);
        }
    }
}
