package org.appointiko.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

@Slf4j
@Service
public class S3ImageStorage implements ImageStorage {

    private final S3Client s3;
    private final String bucket;
    private volatile boolean bucketReady;

    public S3ImageStorage(S3Client s3, @Value("${app.storage.bucket}") String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    @Override
    public void put(String key, byte[] data, String contentType) {
        ensureBucket();
        s3.putObject(b -> b.bucket(bucket).key(key).contentType(contentType), RequestBody.fromBytes(data));
    }

    @Override
    public byte[] get(String key) {
        return s3.getObjectAsBytes(b -> b.bucket(bucket).key(key)).asByteArray();
    }

    @Override
    public void delete(String key) {
        s3.deleteObject(b -> b.bucket(bucket).key(key));
    }

    // Created lazily on first upload so the app starts (and tests run) without the store being up.
    private void ensureBucket() {
        if (bucketReady) {
            return;
        }
        synchronized (this) {
            if (bucketReady) {
                return;
            }
            try {
                s3.headBucket(b -> b.bucket(bucket));
            } catch (NoSuchBucketException e) {
                log.info("Creating storage bucket {}", bucket);
                s3.createBucket(b -> b.bucket(bucket));
            }
            bucketReady = true;
        }
    }
}
