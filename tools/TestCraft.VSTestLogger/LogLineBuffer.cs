namespace TestCraft.VSTestLogger;

internal sealed class LogLineBuffer(int batchSize)
{
    private readonly Lock _lock = new();
    private readonly List<string> _lines = [];

    public IReadOnlyList<string>? Add(string line)
    {
        lock (_lock)
        {
            _lines.Add(line);
            return _lines.Count >= batchSize ? Drain() : null;
        }
    }

    public IReadOnlyList<string>? Flush()
    {
        lock (_lock)
            return _lines.Count > 0 ? Drain() : null;
    }

    private List<string> Drain()
    {
        var batch = new List<string>(_lines);
        _lines.Clear();
        return batch;
    }
}
