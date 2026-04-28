# IEIRP Backend Debugging Guide

## 🔍 **Issue Diagnosis & Resolution**

Based on your request about "still same issues", here's a comprehensive debugging approach:

---

## 📋 **Backend Issues Checklist**

### ✅ **Already Fixed:**
- [x] SecurityConfig import issue (CustomUserDetailsService)
- [x] CORS configuration 
- [x] Endpoint mapping corrections
- [x] Project structure and dependencies

### 🔧 **Remaining Issues to Check:**

#### **1. Compilation Issues**
```bash
# Test compilation
cd ieirp-project/backend
mvn clean compile
```

**Common Problems:**
- Missing dependencies
- Syntax errors in Java files
- Version conflicts

#### **2. Dependency Issues**
```bash
# Check Maven dependencies
mvn dependency:tree
```

**Check pom.xml for:**
- Spring Boot version compatibility
- MySQL connector version
- JWT library versions

#### **3. Database Connection Issues**
```bash
# Test database connection
mvn spring-boot:run
```

**Common Problems:**
- MySQL not running
- Database doesn't exist
- Wrong credentials
- Port conflicts

#### **4. Spring Boot Startup Issues**
**Check application.properties:**
- Server port conflicts
- Database URL format
- JWT secret configuration

---

## 🧪 **Step-by-Step Debugging**

### **Step 1: Verify Java Environment**
```bash
java -version
echo $JAVA_HOME
```

### **Step 2: Test Maven Build**
```bash
cd ieirp-project/backend
mvn clean install
```

### **Step 3: Check Database Setup**
```sql
-- Test database connection
mysql -u root -p -e "SHOW DATABASES;"
mysql -u root -p -e "USE ieirp_db;"
```

### **Step 4: Start Backend with Debug**
```bash
cd ieirp-project/backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Ddebug=true"
```

### **Step 5: Test API Endpoints**
```bash
# Test health check
curl http://localhost:8080/api/categories

# Test authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ieirp.com", "password": "admin123"}'
```

---

## 🐛 **Common Error Solutions**

### **Error: "Failed to load categories: {}"**
**Cause**: Frontend can't connect to backend
**Solutions**:
1. Backend not running on port 8080
2. CORS configuration issue
3. Database connection failure

### **Error: "UserDetailsService not found"**
**Cause**: Spring can't find CustomUserDetailsService
**Solutions**:
1. Check @Service annotation on CustomUserDetailsService
2. Verify package structure
3. Check component scanning

### **Error: "Authentication failed"**
**Cause**: Password encoding or JWT issues
**Solutions**:
1. Check password encryption
2. Verify JWT secret
3. Check authentication flow

---

## 🔧 **Quick Fixes**

### **Fix 1: Update Maven Dependencies**
If you have dependency issues, update pom.xml:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
</dependency>
```

### **Fix 2: Database Setup**
```sql
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ieirp_db;

-- Use database
USE ieirp_db;
```

### **Fix 3: Application Properties**
Update `application.properties`:
```properties
# For development
spring.datasource.url=jdbc:mysql://localhost:3306/ieirp_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
```

---

## 🧪 **Testing Commands**

### **Frontend Testing** (Available Now)
```bash
cd ieirp-project/frontend
python -m http.server 8081
# Open http://localhost:8081
```

### **Backend Testing** (When Ready)
```bash
cd ieirp-project/backend
mvn spring-boot:run
# Open http://localhost:8081 for frontend
```

### **Integration Testing**
```bash
# Test full workflow
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'
```

---

## 📊 **Expected Results**

### **Successful Startup:**
- Backend runs on port 8080
- Database tables created automatically
- Default admin user created
- Categories populated
- Frontend connects without errors

### **Successful API Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "admin@ieirp.com",
  "name": "System Administrator",
  "role": "ADMIN"
}
```

---

## 🚨 **Troubleshooting Steps**

1. **Check Console Output**: Look for specific error messages
2. **Verify Database**: Ensure MySQL is running and accessible
3. **Check Ports**: Ensure 8080 and 8081 are available
4. **Clear Cache**: `mvn clean` before building
5. **Test Incrementally**: Start with minimal configuration

---

## 📞 **Getting Help**

If issues persist:
1. Check IDE console for specific error messages
2. Review application logs in detail
3. Test components individually
4. Verify all configuration files
5. Check network connectivity

---

**Ready for systematic debugging! 🎯**
