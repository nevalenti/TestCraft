using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TestCraft.Persistence;

/// <summary>Npgsql only writes UTC offsets to <c>timestamptz</c>, so clients may send any offset.</summary>
public sealed class UtcDateTimeOffsetConverter()
    : ValueConverter<DateTimeOffset, DateTimeOffset>(
        value => value.ToUniversalTime(),
        value => value
    );
