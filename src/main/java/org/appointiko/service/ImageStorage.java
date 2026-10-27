package org.appointiko.service;

/**
 * Object storage for uploaded images. Backed by an S3-compatible store (MinIO locally).
 */
public interface ImageStorage {

    void put(String key, byte[] data, String contentType);

    byte[] get(String key);

    void delete(String key);
}
