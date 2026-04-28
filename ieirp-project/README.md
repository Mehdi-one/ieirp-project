# IEIRP - Ifrane Environmental Incident Reporting Platform

A full-stack web application for reporting and managing environmental incidents in the Ifrane region. Built with Spring Boot backend and modern frontend technologies.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure login/registration with JWT tokens
- **Role-Based Access Control**: Citizen, Authority, and Admin roles
- **Incident Reporting**: Submit environmental incidents with categories
- **Status Tracking**: Monitor incident progress (Reported → Under Review → In Progress → Resolved)
- **Dashboard**: Authority dashboard for incident management
- **Admin Panel**: User and category management

### Incident Categories
- Forest Fire
- Snow-blocked Road
- Water Issues
- Infrastructure Damage
- Wildlife Incidents
- Air Pollution
- Waste Management
- Noise Pollution

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.0
- **Security**: Spring Security with JWT authentication
- **Database**: MySQL with Spring Data JPA
- **Architecture**: MVC pattern with Controller → Service → Repository layers

### Frontend
- **Technologies**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Responsive, modern UI with mobile support
- **API**: RESTful API integration with fetch API

## 📁 Project Structure

```
ieirp-project/
├── backend/
│   ├── src/main/java/com/ieirp/
│   │   ├── controller/          # REST Controllers
│   │   ├── model/              # JPA Entities
│   │   ├── repository/         # Data Repositories
│   │   ├── service/            # Business Logic
│   │   ├── security/           # Security Configuration
│   │   ├── config/             # Configuration Classes
│   │   └── IeirpApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml                 # Maven Configuration
├── frontend/
│   ├── index.html              # Main HTML File
│   ├── styles.css              # CSS Styles
│   └── script.js               # JavaScript Logic
└── README.md                   # This File
```

## 🚀 Setup Instructions

### Prerequisites
- **Java 17** or higher
- **Maven 3.6** or higher
- **MySQL 8.0** or higher
- **Node.js** (optional, for frontend development)

### Database Setup

1. **Install MySQL** on your system
2. **Create Database**:
   ```sql
   CREATE DATABASE ieirp_db;
   ```
3. **Create User** (optional, recommended for production):
   ```sql
   CREATE USER 'ieirp_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON ieirp_db.* TO 'ieirp_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Backend Setup

1. **Navigate to Backend Directory**:
   ```bash
   cd ieirp-project/backend
   ```

2. **Update Database Configuration**:
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/ieirp_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build and Run**:
   ```bash
   # Using Maven
   mvn clean install
   mvn spring-boot:run
   
   # Or run directly from IDE
   # Run IeirpApplication.java
   ```

4. **Verify Backend**:
   - API will be available at `http://localhost:8080`
   - Test health: `http://localhost:8080/api/auth/me` (should return 401 unauthorized)

### Frontend Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd ieirp-project/frontend
   ```

2. **Serve the Frontend**:
   ```bash
   # Using Python
   python -m http.server 8081
   
   # Using Node.js (if installed)
   npx serve -p 8081
   
   # Or using PHP
   php -S localhost:8081
   ```

3. **Access the Application**:
   - Open `http://localhost:8081` in your browser

## 📱 User Roles & Access

### Default Admin Account
- **Email**: admin@ieirp.com
- **Password**: admin123
- **Role**: Administrator

### Role Permissions

#### Citizen
- Register/Login
- Report incidents
- View own incidents
- Track incident status

#### Authority
- All Citizen permissions
- View all incidents
- Update incident status
- Filter and search incidents
- Access dashboard with statistics

#### Administrator
- All Authority permissions
- Manage users (create, update, delete)
- Manage categories
- Assign user roles
- Full system access

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - Get all incidents (Authority/Admin)
- `GET /api/incidents/my` - Get current user incidents
- `GET /api/incidents/{id}` - Get incident by ID
- `PUT /api/incidents/{id}/status` - Update incident status
- `GET /api/incidents/filter` - Filter incidents
- `GET /api/incidents/stats` - Get incident statistics

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/{id}` - Update category (Admin)
- `DELETE /api/categories/{id}` - Delete category (Admin)

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/role` - Assign user role

## 📊 Sample API Usage

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Incident
```bash
curl -X POST http://localhost:8080/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category": {"id": 1},
    "location": "Ifrane City Center",
    "description": "Large tree blocking the road",
    "latitude": 33.533331,
    "longitude": -5.166667
  }'
```

## 🛠️ Development

### Backend Development
- Use any IDE (IntelliJ IDEA, Eclipse, VS Code)
- Run tests: `mvn test`
- Build JAR: `mvn clean package`
- The application includes auto-configuration for initial data (categories and admin user)

### Frontend Development
- Edit HTML/CSS/JS files directly
- Use browser developer tools for debugging
- Frontend automatically handles API calls and authentication

### Database Schema
The application uses Hibernate auto-DDL mode (`spring.jpa.hibernate.ddl-auto=update`):
- Tables are created automatically on first run
- Schema updates automatically when entities change
- Initial data is populated by `DataInitializer`

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based authentication
- **Password Encryption**: BCrypt hashing for user passwords
- **Role-Based Access**: Method-level security annotations
- **CORS Configuration**: Cross-origin requests properly configured
- **Input Validation**: Bean validation for all input fields

## 🌐 Deployment

### Production Considerations
1. **Database**: Use production MySQL instance
2. **Environment Variables**: Store secrets in environment variables
3. **HTTPS**: Configure SSL/TLS certificates
4. **File Storage**: Configure proper file upload storage
5. **Logging**: Set up proper logging configuration

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM openjdk:17-jdk-slim
COPY target/ieirp-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in application.properties
   - Ensure database exists

2. **CORS Issues**
   - Check CORS configuration in SecurityConfig
   - Verify frontend URL is allowed

3. **JWT Token Issues**
   - Check JWT secret in application.properties
   - Verify token expiration time

4. **Port Conflicts**
   - Change server port in application.properties
   - Ensure ports 8080 and 8081 are available

### Debug Mode
Enable debug logging in `application.properties`:
```properties
logging.level.com.ieirp=DEBUG
logging.level.org.springframework.security=DEBUG
```

## 📈 Future Enhancements

- **Image Upload**: Complete image upload functionality
- **Map Integration**: Display incidents on interactive map
- **Email Notifications**: Send email updates for incident status changes
- **Mobile App**: React Native mobile application
- **Real-time Updates**: WebSocket implementation for live updates
- **Advanced Analytics**: Comprehensive reporting and analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: support@ieirp.com
- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bug reports and feature requests

---

**Built with ❤️ for the Ifrane community**
