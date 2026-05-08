package com.ieirp.repository;

import com.ieirp.model.Incident;
import com.ieirp.model.Incident.IncidentStatus;
import com.ieirp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByUser(User user);

    @Query("SELECT i FROM Incident i WHERE i.user = :user AND (i.archived = false OR i.archived IS NULL)")
    List<Incident> findActiveByUser(@Param("user") User user);

    List<Incident> findByStatus(IncidentStatus status);
    List<Incident> findByCategoryId(Long categoryId);
    
    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:categoryId IS NULL OR i.category.id = :categoryId) AND " +
           "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.createdAt <= :endDate) AND " +
           "(:archived IS NULL OR " +
           "(:archived = false AND (i.archived = false OR i.archived IS NULL)) OR " +
           "(:archived = true AND i.archived = true))")
    List<Incident> findIncidentsWithFilters(
            @Param("status") IncidentStatus status,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("archived") Boolean archived
    );
    
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = :status AND (i.archived = false OR i.archived IS NULL)")
    long countActiveByStatus(@Param("status") IncidentStatus status);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.archived = false OR i.archived IS NULL")
    long countActiveIncidents();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.archived = true")
    long countArchivedIncidents();
}
