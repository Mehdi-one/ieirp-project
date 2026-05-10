# IEIRP - Ifrane Environmental Incident Reporting Platform

IEIRP is a full-stack environmental incident reporting platform designed for the Ifrane region. It allows visitors and citizens to report environmental incidents, while authority users and administrators can review, map, update, resolve, and archive those reports through a secure role-based workflow.

This repository contains the final implementation for a university software engineering project.

## Project Overview

Environmental incidents in a city or region are often reported through informal channels such as phone calls, social media, or word of mouth. This can make response coordination slower and less reliable.

IEIRP solves this by centralizing reports in one platform. Each incident can include a category, location, description, coordinates, image evidence, status, reporter information, and archive state. Authorities can then manage incidents from a dashboard with maps, charts, filters, and status updates.

## Main Features

- Public landing page for visitors
- Public emergency incident reporting without login
- Reporter email collection for public reports
- User registration and login
- JWT authentication
- Role-based access control for Citizen, Authority, and Admin users
- Citizen "My Incidents" page
- Incident detail page with image, map, status, reporter, and coordinates
- Image preview before report submission
- Success screen after public report submission
- Authority dashboard with statistics cards
- Chart.js status chart
- Leaflet.js map using incident latitude and longitude
- Search and filter incidents by status, category, and archive state
- Incident status workflow: Reported, Under Review, In Progress, Resolved, Rejected
- Archive and restore workflow for resolved incidents
- Admin panel for users, roles, and categories
- MySQL database persistence
- Seed data with default users, categories, and realistic Ifrane-area incidents

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java, Spring Boot, Spring Web |
| Security | Spring Security, JWT, BCrypt |
| Database | MySQL, Spring Data JPA, Hibernate |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Maps | Leaflet.js, OpenStreetMap |
| Charts | Chart.js |
| Build Tool | Apache Maven |

## Repository Structure

```text
personal-website/
+-- README.md
+-- ieirp-project/
    +-- backend/
    |   +-- pom.xml
    |   +-- src/main/
    |       +-- java/com/ieirp/
    |       |   +-- config/
    |       |   +-- controller/
    |       |   +-- model/
    |       |   +-- repository/
    |       |   +-- security/
    |       |   +-- service/
    |       |   +-- IeirpApplication.java
    |       +-- resources/
    |           +-- application.properties
    +-- frontend/
        +-- index.html
        +-- styles.css
        +-- script.js
```

Note: The frontend is implemented as a simple single-page application. Pages such as Home, Report Incident, My Incidents, Dashboard, Admin, and Incident Detail are sections inside `frontend/index.html` and are controlled by `frontend/script.js`.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ieirp.com` | `admin123` |
| Authority | `authority@ieirp.com` | `password123` |
| Citizen | `citizen@ieirp.com` | `password123` |

If the citizen account does not exist in your database, you can register a new citizen from the frontend.

## Prerequisites

- Java 17 or newer
- Apache Maven
- MySQL 8 or compatible
- A browser
- Live Server or any static file server for the frontend

## Database Setup

Create the database:

```sql
CREATE DATABASE ieirp;
```

Then update the database credentials in:

```text
ieirp-project/backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ieirp?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

## Running the Backend

From the repository root:

```powershell
cd ieirp-project/backend
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

Quick check:

```powershell
Invoke-RestMethod http://localhost:8080/api/categories
```

## Running the Frontend

Option 1: Use VS Code Live Server and open:

```text
http://127.0.0.1:5500/ieirp-project/frontend/
```

Option 2: Use any static server from the frontend folder:

```powershell
cd ieirp-project/frontend
python -m http.server 8081
```

Then open:

```text
http://localhost:8081
```

## API Summary

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
| View landing page | Yes | Yes | Yes | Yes |
| Submit public report | Yes | Yes | Yes | Yes |
| Register and login | Yes | Yes | Yes | Yes |
| View own incidents | No | Yes | Yes | Yes |
| View authority dashboard | No | No | Yes | Yes |
| Update incident status | No | No | Yes | Yes |
| Resolve/archive incidents | No | No | Yes | Yes |
| Manage users and roles | No | No | No | Yes |
| Manage categories | No | No | No | Yes |

## Demo Flow

1. Open the landing page.
2. Submit a public incident report with category, location, coordinates, description, email, and image.
3. Show the success screen.
4. Log in as an authority user.
5. Open the dashboard and show statistics, chart, filters, search, and map.
6. Open an incident detail page.
7. Update the status and resolve an incident.
8. Archive a resolved incident and toggle archived incidents.
9. Log in as admin and show user role management and categories.

## Team

| Member | Contribution |
| --- | --- |
| Mehdi Hajjari | Led the full-stack implementation, backend APIs, database integration, authentication, role-based access control, frontend integration, dashboard workflows, and debugging. |
| Yassir El Gorfty El Qasemy | Supported frontend review, usability feedback, testing, report organization, and final demo preparation. |

## Notes

- The project is designed for a university demonstration and local execution.
- `DataInitializer.java` seeds default users, categories, and demo incidents.
- The backend API is expected at `http://localhost:8080/api`.
- The frontend is intentionally built with plain HTML, CSS, and JavaScript to keep the project simple and easy to explain.
