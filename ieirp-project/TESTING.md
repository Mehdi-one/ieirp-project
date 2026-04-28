# IEIRP Testing Guide

This guide provides comprehensive testing instructions for the IEIRP (Ifrane Environmental Incident Reporting Platform).

## 🧪 Testing Overview

The application can be tested at multiple levels:
1. **Backend API Testing** - Test REST endpoints directly
2. **Frontend UI Testing** - Test user interface through browser
3. **Integration Testing** - Test complete workflows
4. **Manual Testing** - Step-by-step user scenarios

## 🚀 Quick Start Testing

### Prerequisites
- MySQL installed and running
- Java 17+ and Maven installed
- Web browser for frontend testing

### Step 1: Database Setup
```sql
-- Create database
CREATE DATABASE ieirp_db;

-- Optional: Create dedicated user
CREATE USER 'ieirp_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ieirp_db.* TO 'ieirp_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Start Backend
```bash
cd ieirp-project/backend
mvn spring-boot:run
```
Backend will start on `http://localhost:8080`

### Step 3: Start Frontend
```bash
cd ieirp-project/frontend
python -m http.server 8081
```
Frontend will be available at `http://localhost:8081`

### Step 4: Access Application
Open browser and navigate to `http://localhost:8081`

## 🔧 Backend API Testing

### Test with curl Commands

#### 1. Test Application Health
```bash
curl http://localhost:8080/api/auth/me
# Expected: 401 Unauthorized (security is working)
```

#### 2. Register New User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Citizen",
    "email": "citizen@test.com",
    "password": "password123"
  }'

# Expected: Success response with user ID
```

#### 3. Login as Citizen
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@test.com",
    "password": "password123"
  }'

# Expected: JWT token and user info
# Save the token for subsequent requests
```

#### 4. Login as Admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ieirp.com",
    "password": "admin123"
  }'

# Expected: Admin JWT token
```

#### 5. Get Categories
```bash
curl http://localhost:8080/api/categories

# Expected: List of 8 predefined categories
```

#### 6. Create Incident (as Citizen)
```bash
curl -X POST http://localhost:8080/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CITIZEN_TOKEN" \
  -d '{
    "category": {"id": 1},
    "location": "Ifrane City Center",
    "description": "Large fallen tree blocking main road",
    "latitude": 33.533331,
    "longitude": -5.166667
  }'

# Expected: Created incident with ID
```

#### 7. Get All Incidents (as Admin)
```bash
curl http://localhost:8080/api/incidents \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected: List of all incidents
```

#### 8. Update Incident Status (as Admin)
```bash
curl -X PUT http://localhost:8080/api/incidents/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "UNDER_REVIEW"
  }'

# Expected: Updated incident status
```

### Test with Postman

Import these collections into Postman:

#### Authentication Collection
```json
{
  "info": {
    "name": "IEIRP Authentication",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/register",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@ieirp.com\",\n  \"password\": \"admin123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080"
    }
  ]
}
```

## 🌐 Frontend UI Testing

### Test Scenarios

#### Scenario 1: User Registration
1. Navigate to `http://localhost:8081`
2. Click "Register" link
3. Fill in registration form:
   - Name: "Test Citizen"
   - Email: "citizen@test.com"
   - Password: "password123"
4. Click "Register"
5. **Expected**: Success message, redirect to login

#### Scenario 2: User Login
1. On login page, enter credentials:
   - Email: "citizen@test.com"
   - Password: "password123"
2. Click "Login"
3. **Expected**: Successful login, redirect to home page

#### Scenario 3: Report Incident
1. Login as citizen
2. Navigate to "Report Incident"
3. Fill incident form:
   - Category: "Forest Fire"
   - Location: "Ifrane Forest Area"
   - Description: "Small fire detected near hiking trail"
   - Latitude: "33.533331"
   - Longitude: "-5.166667"
4. Click "Submit Report"
5. **Expected**: Success message, incident created

#### Scenario 4: View My Incidents
1. Login as citizen
2. Navigate to "My Incidents"
3. **Expected**: List of incidents reported by user
4. Click on incident to view details

#### Scenario 5: Authority Dashboard
1. Login as admin: "admin@ieirp.com" / "admin123"
2. Navigate to "Dashboard"
3. **Expected**: Statistics dashboard with incident counts
4. Test filtering by status and category
5. Test updating incident status

#### Scenario 6: Admin Panel
1. Login as admin
2. Navigate to "Admin"
3. **Users Tab**:
   - View all users
   - Change user roles
   - Delete users (test carefully)
4. **Categories Tab**:
   - View all categories
   - Add new category
   - Delete category

### Browser Testing Checklist

#### Functional Testing
- [ ] User registration works
- [ ] User login works with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Incident creation works
- [ ] Incident listing works
- [ ] Incident status updates work
- [ ] Dashboard statistics display correctly
- [ ] Admin functions work properly

#### UI/UX Testing
- [ ] Responsive design on mobile devices
- [ ] Navigation works correctly
- [ ] Forms validate input properly
- [ ] Error messages display correctly
- [ ] Loading states show properly
- [ ] Notifications work correctly

#### Security Testing
- [ ] Unauthorized access is blocked
- [ ] JWT tokens work properly
- [ ] Role-based access control works
- [ ] Passwords are encrypted
- [ ] CORS configuration works

## 📊 Test Data

### Default Admin Account
- **Email**: admin@ieirp.com
- **Password**: admin123
- **Role**: ADMIN

### Sample Test Users
```json
{
  "citizen": {
    "name": "John Citizen",
    "email": "citizen@test.com",
    "password": "password123",
    "role": "CITIZEN"
  },
  "authority": {
    "name": "Jane Authority",
    "email": "authority@test.com",
    "password": "password123",
    "role": "AUTHORITY"
  }
}
```

### Sample Incidents
```json
{
  "forest_fire": {
    "category": "Forest Fire",
    "location": "Ifrane National Park",
    "description": "Small fire detected near picnic area",
    "latitude": 33.533331,
    "longitude": -5.166667
  },
  "road_block": {
    "category": "Snow-blocked Road",
    "location": "Route 13 near Ifrane",
    "description": "Heavy snow blocking main highway",
    "latitude": 33.540000,
    "longitude": -5.150000
  }
}
```

## 🐛 Common Issues & Solutions

### Database Connection Issues
**Problem**: Application fails to start with database errors
**Solution**:
1. Verify MySQL is running
2. Check database credentials in `application.properties`
3. Ensure database `ieirp_db` exists
4. Verify user has proper permissions

### CORS Issues
**Problem**: Frontend can't connect to backend
**Solution**:
1. Check CORS configuration in `SecurityConfig.java`
2. Verify frontend URL is in allowed origins
3. Check browser console for CORS errors

### Authentication Issues
**Problem**: Login fails or tokens don't work
**Solution**:
1. Check JWT secret in `application.properties`
2. Verify token expiration time
3. Check user credentials in database
4. Ensure password encryption is working

### Port Conflicts
**Problem**: Applications won't start due to port conflicts
**Solution**:
1. Change backend port in `application.properties`
2. Use different frontend port
3. Kill processes using the ports

## 🧪 Automated Testing

### Backend Tests
```bash
cd ieirp-project/backend
mvn test
```

### Test Coverage
- Unit tests for service layers
- Integration tests for controllers
- Security tests for authentication

### Frontend Tests
```javascript
// Example browser console test
fetch('http://localhost:8080/api/categories')
  .then(response => response.json())
  .then(data => console.log('Categories:', data));
```

## 📈 Performance Testing

### Load Testing
- Test with multiple concurrent users
- Test incident creation under load
- Test database performance

### Stress Testing
- Test with large number of incidents
- Test with large file uploads
- Test database connection limits

## 📋 Testing Checklist

### Pre-deployment Testing
- [ ] All API endpoints work correctly
- [ ] Authentication and authorization work
- [ ] Database operations work
- [ ] Frontend UI works in all browsers
- [ ] Mobile responsive design works
- [ ] Error handling works
- [ ] Security measures are effective

### User Acceptance Testing
- [ ] Citizens can register and report incidents
- [ ] Authorities can view and manage incidents
- [ ] Admins can manage users and categories
- [ ] System is intuitive and easy to use
- [ ] Performance is acceptable

---

**Happy Testing! 🎉**
