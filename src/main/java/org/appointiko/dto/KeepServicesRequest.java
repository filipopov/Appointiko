package org.appointiko.dto;

import java.util.List;

public record KeepServicesRequest(List<Long> activeIds) {}
