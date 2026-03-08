FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN echo "registry=https://registry.npmjs.org/" > /root/.npmrc && \
    ./mvnw -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
