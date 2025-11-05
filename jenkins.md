# 🚀 Jenkins CI/CD Setup
### Docker Compose + Jenkins Pipeline (Windows, Linux, macOS)
---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Jenkins Configuration](#jenkins-configuration)
7. [Pipeline Setup](#pipeline-setup)
8. [Troubleshooting](#troubleshooting)
9. [Tips & Best Practices](#tips--best-practices)

---

## Overview

Setup ini memberikan complete CI/CD environment dengan:
- ✅ **Jenkins** - CI/CD orchestration & UI
- ✅ **Jenkins Agent** - Worker node untuk menjalankan build
- ✅ **SonarQube** - Code quality & security analysis
- ✅ **PostgreSQL** - Database untuk SonarQube
- ✅ **Docker-in-Docker** - Build & deploy containers

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                  Docker Host                         │
│  ┌──────────────────────────────────────────────┐  │
│  │         jenkins-net Network                   │  │
│  │                                                │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐ │  │
│  │  │ Jenkins │  │  Agent  │  │  SonarQube   │ │  │
│  │  │  :8080  │  │ (Worker)│  │   :9000      │ │  │
│  │  └────┬────┘  └────┬────┘  └──────┬───────┘ │  │
│  │       │            │                │         │  │
│  │       └────────────┴────────────────┘         │  │
│  │                    │                           │  │
│  │              ┌─────▼──────┐                   │  │
│  │              │ PostgreSQL │                   │  │
│  │              │   :5432    │                   │  │
│  │              └────────────┘                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Docker Socket                        │  │
│  │      /var/run/docker.sock                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```
---

## Project Structure

```
training-apps/
├── docker-compose.yml          # Main orchestration
├── Jenkinsfile                 # Pipeline definition
├── README.md                   # This file
│
├── app/
│   ├── Dockerfile             # Application container
│   ├── package.json
│   ├── app.js
│   └── ... (application code)
│
├── jenkins/
│   └── Dockerfile             # Jenkins master
│
└── jenkins-agent/
    └── Dockerfile             # Jenkins agent/worker
```

---

## Configuration Files

### 1. docker-compose.yml

**Complete multi-platform configuration:**

```yaml
name: simple

services:
  app:
    build: ./app
    container_name: simple-app
    ports:
      - "5050:3000"
    volumes:
      - vol-simple:/app/public/images/
    networks:
      - jenkins-net
    restart: unless-stopped

  sonarqube:
    image: sonarqube:9.9.1-community
    container_name: simple-sonarqube
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "9000:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonar
      - SONAR_JDBC_USERNAME=sonar
      - SONAR_JDBC_PASSWORD=sonar
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    deploy:
      resources:
        limits:
          memory: 2g
    networks:
      - jenkins-net
    restart: unless-stopped

  db:
    image: postgres:15
    container_name: simple-db
    environment:
      - POSTGRES_USER=sonar
      - POSTGRES_PASSWORD=sonar
      - POSTGRES_DB=sonar
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sonar"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jenkins-net
    restart: unless-stopped

  jenkins:
    build: ./jenkins
    container_name: simple-jenkins
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
      - DOCKER_HOST=unix:///var/run/docker.sock
    networks:
      - jenkins-net
    restart: unless-stopped

  agent:
    build: ./jenkins-agent
    container_name: simple-agent
    user: root  # Required for Docker socket access
    depends_on:
      - jenkins
    environment:
      - JENKINS_URL=http://jenkins:8080
      - JENKINS_AGENT_NAME=devops1-agent
      - JENKINS_AGENT_WORKDIR=/home/jenkins/agent
      # UPDATE WITH YOUR SECRET FROM JENKINS UI
      - JENKINS_SECRET=${JENKINS_SECRET:-}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - agent_workspace:/home/jenkins/agent
    networks:
      - jenkins-net
    restart: unless-stopped

volumes:
  vol-simple:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgres_data:
  jenkins_home:
  agent_workspace:

networks:
  jenkins-net:
    driver: bridge
```

---

### 2. jenkins/Dockerfile

**Multi-platform Jenkins master with Docker CLI:**

```dockerfile
FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI (auto-detects architecture)
RUN apt-get update && \
    apt-get install -y \
    git \
    git-lfs \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    # Install Docker CLI and Docker Compose plugin
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    # Cleanup
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    git \
    workflow-aggregator \
    docker-workflow \
    sonar \
    blueocean

USER jenkins

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
```

---

### 3. jenkins-agent/Dockerfile

**Multi-platform agent with Node.js, Docker, and SonarScanner:**

```dockerfile
FROM jenkins/inbound-agent:latest-jdk17

USER root

# Install Node.js, Docker CLI, and SonarScanner (multi-platform)
RUN apt-get update && \
    apt-get install -y \
    curl \
    gnupg2 \
    git \
    git-lfs \
    ca-certificates \
    unzip \
    lsb-release && \
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    # Install Docker CLI and Docker Compose plugin
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    # Install SonarScanner CLI
    mkdir -p /opt/sonar-scanner && \
    curl -sLo /tmp/sonar.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip && \
    unzip /tmp/sonar.zip -d /opt/sonar-scanner && \
    ln -sf /opt/sonar-scanner/sonar-scanner-*/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    chmod +x /usr/local/bin/sonar-scanner && \
    rm /tmp/sonar.zip && \
    # Cleanup
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    # Verify installations
    node -v && npm -v && git --version && docker --version && sonar-scanner --version

# Add SonarScanner to PATH
ENV PATH="/usr/local/bin:/opt/sonar-scanner/sonar-scanner-5.0.1.3006-linux/bin:${PATH}"

# Set Docker host
ENV DOCKER_HOST=unix:///var/run/docker.sock

USER jenkins

WORKDIR /home/jenkins/agent
```

---

### 4. app/Dockerfile

**Simple Node.js application:**

```dockerfile
FROM node:18.20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

---

### 5. Jenkinsfile

**Complete CI/CD pipeline:**

```groovy
pipeline {
    agent { label 'devops1-agent' }

    stages {
        stage('Pull SCM') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/YOUR_USERNAME/training-app.git'
            }
        }
        
        stage('Build') {
            steps {
                echo 'Installing dependencies...'
                dir('app') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Testing') {
            steps {
                echo 'Running tests...'
                dir('app') {
                    sh 'npm test'
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    echo 'Test stage completed'
                }
            }
        }
        
        stage('Code Review') {
            steps {
                echo 'Running SonarQube analysis...'
                dir('app') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=simple-apps \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://sonarqube:9000 \
                            -Dsonar.login=YOUR_SONARQUBE_TOKEN
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh '''
                    docker compose build app
                    docker compose up -d --force-recreate --no-deps app
                '''
            }
        }

        stage('Backup') {
            steps {
                echo 'Backup stage...'
                sh 'echo "Backup completed or skipped"'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🏁 Pipeline finished!'
        }
    }
}
```

---

## Setup Instructions

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/training-apps.git
cd training-apps
```

### Step 2: Start All Services

**Windows (PowerShell):**
```powershell
docker compose up -d --build
```

**macOS/Linux:**
```bash
docker compose up -d --build
```

**First build will take 7-10 minutes** depending on internet speed.

### Step 3: Verify All Containers Running

```bash
docker compose ps
```

Expected output - all should show "Up":
```
NAME                STATUS
simple-app          Up
simple-jenkins      Up
simple-agent        Up
simple-sonarqube    Up
simple-db           Up (healthy)
```

### Step 4: Access Services

Open in your browser:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Jenkins** | http://localhost:8080 | Initial admin password (see below) |
| **SonarQube** | http://localhost:9000 | admin / admin (change on first login) |
| **Application** | http://localhost:5050 | No auth |

**Get Jenkins Initial Password:**
```bash
docker exec simple-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## Jenkins Configuration

### Step 1: Initial Setup Wizard

1. Access http://localhost:8080
2. Enter the initial admin password
3. Click **Install suggested plugins**
   Kamu harus sudah lihat plugin seperti:
   - Docker Pipeline
   - Pipeline
   - Pipeline: Github
   - Pipeline: Stage View Plugin
   - SonarQube Scanner for Jenkins
5. Wait for plugins to install (~2-3 minutes)
6. Create your admin user
7. Save and Continue
8. Jenkins URL: http://localhost:8080 (default is fine)
9. Click **Start using Jenkins**

### Step 2: Configure Jenkins Agent

1. Go to **Manage Jenkins** → **Manage Nodes and Clouds**
2. Click **New Node**
3. Configuration:
   - **Node name:** `devops1-agent`
   - **Type:** Permanent Agent
   - Click **Create**

4. Node settings:
   - **Number of executors:** `2`
   - **Remote root directory:** `/home/jenkins/agent`
   - **Labels:** `devops1-agent`
   - **Usage:** Use this node as much as possible
   - **Launch method:** Launch agent by connecting it to the controller
   - ✅ **Use WebSocket:** CHECK THIS BOX (important!)

5. Click **Save**

6. **Copy the secret** shown on the screen (looks like: `abc123def456...`)

### Step 3: Update Agent Secret

Edit `docker-compose.yml` and add the secret:

```yaml
agent:
  environment:
    - JENKINS_SECRET=paste-your-secret-here  # ← ADD YOUR SECRET
```

Restart agent:
```bash
docker compose up -d agent
```

Verify agent is connected:
```bash
docker logs simple-agent
# Should see: "Connected"
```

In Jenkins UI, agent should show as "Connected" with green icon.

### Step 4: Configure SonarQube

1. Access http://localhost:9000
2. Login with: `admin` / `admin`
3. Change password when prompted
4. Go to **My Account** → **Security** → **Generate Token**
   - Name: `jenkins`
   - Type: Global Analysis Token
   - Click **Generate**
   - **Copy the token** (e.g., `sqp_abc123...`)

5. Add token to Jenkins:
   - Go to Jenkins: **Manage Jenkins** → **Credentials**
   - Click **System** → **Global credentials (unrestricted)**
   - Click **Add Credentials**
   - Kind: **Secret text**
   - Secret: paste your SonarQube token
   - ID: `sonarqube-token`
   - Description: `SonarQube Auth Token`
   - Click **Create**

---

## Pipeline Setup

### Step 1: Create Pipeline Job

1. In Jenkins, click **New Item**
2. Enter name: `simple-app-pipeline`
3. Select: **Pipeline**
4. Click **OK**

### Step 2: Configure Pipeline

1. Scroll to **Pipeline** section
2. Definition: **Pipeline script from SCM**
3. SCM: **Git**
4. Repository URL: `https://github.com/YOUR_USERNAME/training-apps.git`
5. Branch: `*/main`
6. Script Path: `Jenkinsfile`
7. Click **Save**

### Step 3: Update Jenkinsfile in Repository

Update your Jenkinsfile on GitHub with correct values:

1. Repository URL (line 8)
2. SonarQube token (line 39 - or use credentials)

**Better approach - use credentials:**
```groovy
environment {
    SONAR_LOGIN = credentials('sonarqube-token')
}

stage('Code Review') {
    steps {
        dir('app') {
            sh '''
                sonar-scanner \
                    -Dsonar.projectKey=simple-apps \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://sonarqube:9000 \
                    -Dsonar.login=${SONAR_LOGIN}
            '''
        }
    }
}
```

### Step 4: Run Pipeline

1. In Jenkins, go to your pipeline job
2. Click **Build Now**
3. Watch the build progress in **Blue Ocean** or classic UI

**Expected stages:**
```
✅ Pull SCM          - Clone code
✅ Build             - npm ci
✅ Testing           - Run tests (100% coverage)
✅ Code Review       - SonarQube analysis
✅ Deploy            - Rebuild & restart container
✅ Backup            - Optional backup step
```

### Step 5: View Results

- **Jenkins:** Pipeline execution logs
- **SonarQube:** http://localhost:9000/dashboard?id=simple-apps
- **Application:** http://localhost:5050

---

## Troubleshooting

### Issue: Container keeps restarting

**Check logs:**
```bash
docker logs simple-agent
docker logs simple-app
```

**Common fixes:**
```bash
# Clean restart
docker compose down
docker compose up -d --build

# Check agent connection
docker exec simple-agent docker ps
```

### Issue: Jenkins agent not connecting

**Solution:**
1. Verify secret is correct in docker-compose.yml
2. Restart agent: `docker compose restart agent`
3. Check logs: `docker logs simple-agent`
4. Verify WebSocket is enabled in Jenkins node config

### Issue: Docker permission denied in pipeline

**Solution:**
Ensure `user: root` is set for agent in docker-compose.yml:
```yaml
agent:
  user: root  # Required for Docker socket access
```

### Issue: SonarQube can't be reached

**Check:**
```bash
# From agent container
docker exec simple-agent ping -c 3 sonarqube
docker exec simple-agent curl -I http://sonarqube:9000
```

**Fix:** Ensure Jenkinsfile uses `http://sonarqube:9000` NOT `http://localhost:9000`

### Issue: Port already in use

**Find what's using the port:**
```bash
# macOS/Linux
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

**Solution:** Stop the process or change port in docker-compose.yml

---

## Tips & Best Practices

### 1. Multi-Platform Compatibility

✅ **DO:**
- Use `$(dpkg --print-architecture)` for auto-detection
- Install from official Docker repos (auto-detects arch)
- Use official Docker Compose plugin (not standalone binary)
- Test on target platforms before production

❌ **DON'T:**
- Hardcode architecture (e.g., `aarch64`, `x86_64`)
- Download arch-specific binaries manually
- Use platform-specific commands

### 2. Security

✅ **For Development/Learning:**
- Running containers as root is acceptable
- Direct token in Jenkinsfile is OK for testing

✅ **For Production:**
- Use least-privilege users
- Store secrets in Jenkins credentials
- Enable TLS/SSL
- Use Docker secrets or vault solutions
- Regular security updates

### 3. Performance

- **Increase Docker Desktop resources:** 8GB RAM minimum, 16GB recommended
- **Use caching:** npm ci is faster than npm install with lockfile
- **Layer optimization:** Order Dockerfile commands by change frequency
- **Volume cleanup:** Regularly run `docker system prune`

### 4. Monitoring

```bash
# View resource usage
docker stats

# View logs
docker compose logs -f

# Check disk space
docker system df
```

### 5. Backup

**Backup Jenkins data:**
```bash
docker run --rm \
  -v jenkins_home:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/jenkins_backup.tar.gz -C /data .
```

**Restore:**
```bash
docker run --rm \
  -v jenkins_home:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/jenkins_backup.tar.gz"
```

---

## Platform-Specific Notes

### Windows

- Docker Desktop must be running
- Use PowerShell (not CMD) for commands
- Line endings: Set git config `core.autocrlf=false`
- Paths: Use forward slashes in docker-compose.yml

### macOS

- Docker Desktop handles everything automatically
- Apple Silicon: Docker uses Rosetta for x86 images
- Socket permissions: No manual changes needed

### Linux

- May need to add user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```
- Socket permissions:
  ```bash
  sudo chmod 666 /var/run/docker.sock
  ```

---

## Common Commands Reference

```bash
# Start all services
docker compose up -d

# Rebuild specific service
docker compose build --no-cache jenkins
docker compose up -d jenkins

# View logs
docker compose logs -f agent

# Stop all
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Check status
docker compose ps

# Execute command in container
docker exec simple-agent docker ps

# Restart service
docker compose restart agent

# Clean everything
docker system prune -a
```

---

## Summary

| Component | Purpose | Port |
|-----------|---------|------|
| Jenkins | CI/CD controller & UI | 8080 |
| Agent | Worker node for builds | - |
| SonarQube | Code quality analysis | 9000 |
| PostgreSQL | SonarQube database | 5432 |
| Application | Your Node.js app | 5050 |

**Key Features:**
- ✅ Multi-platform support (Windows/macOS/Linux)
- ✅ Auto-architecture detection
- ✅ Complete CI/CD pipeline
- ✅ Code quality analysis
- ✅ Containerized deployment
- ✅ Docker-in-Docker support

---

## Next Steps

1. ✅ Setup complete - all services running
2. 🔧 Customize Jenkinsfile for your needs
3. 📊 Add more tests and coverage
4. 🔒 Implement security best practices
5. 📈 Add monitoring and alerting
6. 🚀 Deploy to production environment

---

**🎉 Congratulations!** 

Your complete CI/CD environment is now ready. Every push to your repository can automatically trigger:
- Automated testing
- Code quality analysis
- Security scanning
- Containerized deployment

**Happy building!** 🚀

---

**Last Updated:** November 2025  
**Tested On:** Windows 11, macOS 14 (Intel & Apple Silicon), Ubuntu 24.04
