using System.Reflection;

namespace TestCraft.Infrastructure.Persistence;

public static class VogenGuidValueObjects
{
    public static bool IsGuidValueObject(Type type) =>
        type.IsValueType
        && !type.IsPrimitive
        && !type.IsEnum
        && type != typeof(Guid)
        && typeof(IEquatable<Guid>).IsAssignableFrom(type);

    public static IEnumerable<Type> AllIn(Assembly assembly) =>
        assembly.GetTypes().Where(IsGuidValueObject);
}
