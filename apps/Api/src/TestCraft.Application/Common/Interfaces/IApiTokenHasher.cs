namespace TestCraft.Application.Common.Interfaces;

public interface IApiTokenHasher
{
    string GenerateToken();
    string Hash(string token);
}
