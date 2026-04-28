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
    List<Incident> findByStatus(IncidentStatus status);
    List<Incident> findByCategoryId(Long categoryId);
    
    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:categoryId IS NULL OR i.category.id = :categoryId) AND " +
           "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.createdAt <= :endDate)")
    List<Incident> findIncidentsWithFilters(
            @Param("status") IncidentStatus status,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = :status")
    long countByStatus(@Param("status") IncidentStatus status);
}
