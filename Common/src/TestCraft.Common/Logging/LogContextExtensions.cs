namespace TestCraft.Common.Logging;

public static class LogContextExtensions
{
    public static IDisposable PushProperties(params IDisposable?[] properties) =>
        new CompositeDisposable(properties);

    private sealed class CompositeDisposable(IDisposable?[] disposables) : IDisposable
    {
        public void Dispose()
        {
            for (var i = disposables.Length - 1; i >= 0; i--)
            {
                disposables[i]?.Dispose();
            }
        }
    }
}
