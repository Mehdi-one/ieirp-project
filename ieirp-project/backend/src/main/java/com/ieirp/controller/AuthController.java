package com.ieirp.controller;
 
import com.ieirp.model.User;
import com.ieirp.security.JwtUtil;
import com.ieirp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
 
import java.util.HashMap;
import java.util.Map;
 
@RestController
@RequestMapping("/api/auth")
public class AuthController {
 
    @Autowired
    private AuthenticationManager authenticationManager;
 
    @Autowired
    private UserService userService;
 
    @Autowired
    private JwtUtil jwtUtil;
 
    // ✅ Use Map instead of User to avoid Jackson/validation binding issues
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        try {
            String name     = request.get("name");
            String email    = request.get("email");
            String password = request.get("password");
 
            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            }
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }
            if (password.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
            }
 
            // Build User manually — no Jackson binding issues
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(password);
            user.setRole(User.Role.CITIZEN);
 
            User saved = userService.registerUser(user);
 
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", saved.getId());
            response.put("email", saved.getEmail());
            response.put("role", saved.getRole());
 
            return ResponseEntity.ok(response);
 
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
 
    // ✅ Login also uses Map — reads "password" field from frontend
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email    = loginRequest.get("email");
        String password = loginRequest.get("password");
 
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
 
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
 
            SecurityContextHolder.getContext().setAuthentication(authentication);
 
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
 
            String jwt = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
 
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("type", "Bearer");
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            response.put("role", user.getRole());
 
            return ResponseEntity.ok(response);
 
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }
 
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
 
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("role", user.getRole());
 
        return ResponseEntity.ok(response);
    }
}
