# IEIRP - Ifrane Environmental Incident Reporting Platform

IEIRP is a full-stack environmental incident reporting platform for the Ifrane region. It allows visitors and citizens to submit incident reports, while authority users and administrators can review, map, update, resolve, and archive reports through a secure role-based workflow.

This folder contains the main application source code:

- `backend/` - Spring Boot REST API
- `frontend/` - HTML, CSS, and vanilla JavaScript frontend

## Key Features

- Public landing page
- Public emergency incident reporting without login
- Reporter email collection for public reports
- Citizen login and personal incident tracking
- Image preview before report submission
- Public report success screen
- Authority dashboard with statistics, filters, search, map, and chart
- Leaflet.js map using stored latitude and longitude
- Chart.js incident status visualization
- Status workflow: Reported, Under Review, In Progress, Resolved, Rejected
- Archive and restore workflow for resolved incidents
- Admin panel for users, roles, and categories
- MySQL persistence for incidents, users, categories, status, coordinates, images, and archived state

## Technology Stack

| Area | Tools |
| --- | --- |
| Backend | Java, Spring Boot, Spring Web |
| Security | Spring Security, JWT, BCrypt |
| Database | MySQL, Spring Data JPA, Hibernate |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Maps | Leaflet.js, OpenStreetMap |
| Charts | Chart.js |
| Build | Apache Maven |

## Project Structure

```text
ieirp-project/
+-- backend/
|   +-- pom.xml
|   +-- src/main/java/com/ieirp/
|   |   +-- config/
|   |   +-- controller/
|   |   +-- model/
|   |   +-- repository/
|   |   +-- security/
|   |   +-- service/
|   |   +-- IeirpApplication.java
|   +-- src/main/resources/
|       +-- application.properties
+-- frontend/
|   +-- index.html
|   +-- styles.css
|   +-- script.js
+-- README.md
+-- TESTING.md
```

The frontend is a single-page application. Sections such as Home, Report Incident, My Incidents, Dashboard, Admin, and Incident Detail are all contained in `frontend/index.html` and controlled by `frontend/script.js`.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ieirp.com` | `admin123` |
| Authority | `authority@ieirp.com` | `password123` |
| Citizen | `citizen@ieirp.com` | `password123` |

If the citizen account is not present in your local database, register a new citizen from the frontend.

## Requirements

- Java 17 or newer
- Apache Maven
- MySQL 8 or compatible
- Browser
- VS Code Live Server or any static file server

## Database Setup

Create the database:

```sql
CREATE DATABASE ieirp;
```

Update your local credentials in:

```text
backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ieirp?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

## Run Backend

From this folder:

```powershell
cd backend
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

Quick test:

```powershell
Invoke-RestMethod http://localhost:8080/api/categories
```

## Run Frontend

Using Live Server:

```text
http://127.0.0.1:5500/ieirp-project/frontend/
```

Or with a static server:

```powershell
cd frontend
python -m http.server 8081
```

Then open:

```text
http://localhost:8081
```

## Main API Endpoints

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Incidents:

- `POST /api/incidents`
- `POST /api/incidents/public`
- `GET /api/incidents/my`
- `GET /api/incidents/filter`
- `GET /api/incidents/stats`
- `GET /api/incidents/{id}`
- `PUT /api/incidents/{id}/status`
- `PUT /api/incidents/{id}/archive`
- `PUT /api/incidents/{id}/unarchive`

Categories:

- `GET /api/categories`
- `POST /api/categories`
- `DELETE /api/categories/{id}`

Admin:

- `GET /api/admin/users`
- `POST /api/admin/users/{id}/role`
- `DELETE /api/admin/users/{id}`

## Role Permissions

| Feature | Visitor | Citizen | Authority | Admin |
| --- | --- | --- | --- | --- |
| Submit public report | Yes | Yes | Yes | Yes |
| View own incidents | No | Yes | Yes | Yes |
| View authority dashboard | No | No | Yes | Yes |
| Update incident status | No | No | Yes | Yes |
| Archive and restore incidents | No | No | Yes | Yes |
| Manage users and roles | No | No | No | Yes |
| Manage categories | No | No | No | Yes |

## Demo Flow

1. Open the landing page.
2. Submit a public report with category, location, description, coordinates, email, and image.
3. Show the success screen.
4. Log in as an authority user.
5. Open the dashboard and show stats, chart, filters, search, and map.
6. Open an incident detail page.
7. Update status, resolve, and archive an incident.
8. Toggle archived incidents.
9. Log in as admin and show role/category management.

## Team

| Member | Contribution |
| --- | --- |
| Mehdi Hajjari | Led the full-stack implementation, backend APIs, database integration, authentication, RBAC, frontend integration, dashboard workflows, and debugging. |
| Yassir El Gorfty El Qasemy | Supported frontend review, usability feedback, functional testing, report organization, and demo preparation. |

## Notes

- `DataInitializer.java` seeds default users, categories, and demo incidents.
- Passwords are stored using BCrypt.
- JWT is used for authenticated API requests.
- The project is designed for a local university demo and can be extended for production deployment.

