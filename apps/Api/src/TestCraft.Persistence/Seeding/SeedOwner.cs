namespace TestCraft.Persistence.Seeding;

public static class SeedOwner
{
    public const string EnvironmentVariable = "SEED_OWNER_USER_ID";

    public static readonly UserId DefaultId = UserId.From(
        Guid.Parse("00000000-0000-0000-0000-000000000001")
    );
}
