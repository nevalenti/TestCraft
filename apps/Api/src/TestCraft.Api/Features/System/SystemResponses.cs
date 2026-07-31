namespace TestCraft.Api.Features.System;

public sealed record AuthConfigResponse(string Authority);

public sealed record StatusResponse(string Status);

public sealed record SystemStatusResponse(
    string Status,
    long Uptime,
    MemoryUsageResponse Memory,
    string Db,
    string Version,
    string Runtime
);

public sealed record MemoryUsageResponse(long Rss, long HeapUsed, long HeapTotal);
