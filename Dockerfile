# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx tsc -b && npx vite build

# Stage 2: Build backend (skip frontend-maven-plugin, use pre-built static files)
FROM eclipse-temurin:21-jdk-alpine AS backend
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:resolve -DskipTests -Dskip.frontend=true
COPY src src
COPY --from=frontend /app/dist src/main/resources/static
RUN ./mvnw -B package -DskipTests -Dskip.frontend=true -Dcopy.frontend.phase=none

# Stage 3: Minimal runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
