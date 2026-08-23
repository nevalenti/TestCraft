using System.Linq.Expressions;
using System.Reflection;

using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TestCraft.Infrastructure.Persistence;

public sealed class VogenGuidConverter<T>(Func<Guid, T> fromGuid, Func<T, Guid> toGuid)
    : ValueConverter<T, Guid>(id => toGuid(id), guid => fromGuid(guid))
    where T : struct
{
    public VogenGuidConverter()
        : this(FromGuid.Value, ToGuid.Value) { }

    private static readonly Lazy<Func<Guid, T>> FromGuid = new(CompileFromGuid);
    private static readonly Lazy<Func<T, Guid>> ToGuid = new(CompileToGuid);

    private static Func<Guid, T> CompileFromGuid()
    {
        if (!VogenGuidValueObjects.IsGuidValueObject(typeof(T)))
        {
            throw new InvalidOperationException(
                $"{typeof(T)} is not a Vogen Guid-backed value object."
            );
        }

        var method = typeof(T).GetMethod(
            "From",
            BindingFlags.Public | BindingFlags.Static,
            [typeof(Guid)]
        )!;
        var parameter = Expression.Parameter(typeof(Guid), "guid");
        var call = Expression.Call(method, parameter);
        return Expression.Lambda<Func<Guid, T>>(call, parameter).Compile();
    }

    private static Func<T, Guid> CompileToGuid()
    {
        var property = typeof(T).GetProperty("Value", BindingFlags.Public | BindingFlags.Instance)!;
        var parameter = Expression.Parameter(typeof(T), "id");
        var access = Expression.Property(parameter, property);
        return Expression.Lambda<Func<T, Guid>>(access, parameter).Compile();
    }
}
