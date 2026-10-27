package org.appointiko.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class StorageConfig {

    @Bean
    public S3Client s3Client(@Value("${app.storage.endpoint}") String endpoint,
                             @Value("${app.storage.region}") String region,
                             @Value("${app.storage.access-key}") String accessKey,
                             @Value("${app.storage.secret-key}") String secretKey) {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                // MinIO serves buckets by path (http://host/bucket/key), not by subdomain.
                .forcePathStyle(true)
                .build();
    }
}
