namespace TestCraft.Application.Common.Interfaces;

public interface IFeatureToggle
{
    bool IsEnabled { get; }
}
