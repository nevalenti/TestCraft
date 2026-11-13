using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TestCraft.Persistence;

public sealed class UtcDateTimeOffsetConverter()
    : ValueConverter<DateTimeOffset, DateTimeOffset>(
        value => value.ToUniversalTime(),
        value => value
    );
