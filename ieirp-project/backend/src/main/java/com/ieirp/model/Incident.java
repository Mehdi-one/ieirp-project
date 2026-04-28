package com.ieirp.model;
 
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
 
import java.time.LocalDateTime;
 
@Entity
@Table(name = "incidents")
public class Incident {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties({"incidents", "hibernateLazyInitializer", "handler"})
    private Category category;
 
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "incidents", "hibernateLazyInitializer", "handler"})
    private User user;
 
    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    @Column(nullable = false)
    private String location;
 
    @Column(columnDefinition = "TEXT")
    private String description;
 
    @Column(name = "image_url")
    private String imageUrl;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;
 
    @Column(name = "latitude")
    private Double latitude;
 
    @Column(name = "longitude")
    private Double longitude;
 
    @Column(name = "created_at")
    private LocalDateTime createdAt;
 
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
 
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
 
    public enum IncidentStatus {
        REPORTED,
        UNDER_REVIEW,
        IN_PROGRESS,
        RESOLVED,
        REJECTED
    }
 
    public Incident() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = IncidentStatus.REPORTED;
    }
 
    public Incident(Category category, User user, String location, String description) {
        this();
        this.category = category;
        this.user = user;
        this.location = location;
        this.description = description;
    }
 
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (status == IncidentStatus.RESOLVED && resolvedAt == null) {
            resolvedAt = LocalDateTime.now();
        }
    }
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}