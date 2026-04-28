# IEIRP Dependency Setup Guide

## 🚨 **Issue Identified**
Maven is not installed on your system, which is why Spring Boot dependencies can't be downloaded and the backend can't compile.

## 🔧 **Solutions**

### **Option 1: Install Maven (Recommended)**
#### **Windows Setup:**
1. **Download Maven**: https://maven.apache.org/download.cgi
2. **Extract** to `C:\Program Files\Apache\maven`
3. **Set Environment Variables**:
   ```cmd
   setx MAVEN_HOME "C:\Program Files\Apache\maven"
   setx PATH "%PATH%;%MAVEN_HOME%\bin"
   ```
4. **Verify Installation**:
   ```cmd
   mvn --version
   ```

#### **Alternative: Use Maven Wrapper (Easier)**
The project should include a Maven wrapper. Let me create one for you:

### **Option 2: Use IDE with Built-in Maven**
#### **IntelliJ IDEA (Recommended)**
1. Download IntelliJ IDEA Community Edition
2. Import project as Maven project
3. IDE will handle dependencies automatically

#### **Eclipse IDE**
1. Download Eclipse IDE for Enterprise Java Developers
2. Import project as Maven project
3. IDE will handle dependencies automatically

#### **VS Code with Java Extension Pack**
1. Install VS Code
2. Install Java Extension Pack
3. Install Maven for Java extension
4. Open project folder

### **Option 3: Use Gradle (Alternative)**
Convert the project to Gradle build system (more modern, fewer dependency issues)

---

## 📦 **Required Dependencies**

The `pom.xml` file includes these dependencies:

### **Spring Boot Core**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### **Database**
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
```

### **Security**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### **JWT**
```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
```

---

## 🚀 **Quick Start Commands**

### **After Maven Installation:**
```bash
# Navigate to backend
cd ieirp-project/backend

# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package

# Run application
mvn spring-boot:run
```

### **Verify Dependencies:**
```bash
# Download all dependencies
mvn dependency:resolve

# Check dependency tree
mvn dependency:tree

# Check for updates
mvn versions:display-dependency-updates
```

---

## 🐛 **Troubleshooting**

### **Common Maven Issues:**
1. **"mvn command not found"**
   - Maven not in PATH
   - Solution: Add Maven bin to PATH

2. **"Connection refused" errors**
   - Maven repositories blocked
   - Solution: Check network/proxy settings

3. **"Dependency resolution failed"**
   - Corrupted pom.xml
   - Solution: Validate XML syntax

4. **"Compilation failed"**
   - Java version mismatch
   - Solution: Ensure Java 17+ is installed

---

## 📋 **Setup Checklist**

- [ ] Java 17+ installed
- [ ] Maven 3.6+ installed
- [ ] Environment variables set
- [ ] Project dependencies resolve
- [ ] Application compiles
- [ ] Application starts successfully
- [ ] Database connection works
- [ ] Frontend connects to backend

---

## 🎯 **Next Steps**

1. **Install Maven** using Option 1 or 2
2. **Navigate to backend directory**
3. **Run**: `mvn spring-boot:run`
4. **Test**: Open `http://localhost:8081` for frontend

---

**Choose the setup method that works best for your environment!**
