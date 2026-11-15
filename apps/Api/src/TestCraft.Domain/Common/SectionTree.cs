using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Common;

public sealed class SectionTree
{
    public const int MaxDepth = 10;

    private readonly Dictionary<TestSectionId, TestSection> byId;
    private readonly ILookup<TestSectionId?, TestSection> byParent;

    public SectionTree(IEnumerable<TestSection> sections)
    {
        byId = sections.ToDictionary(section => section.Id);
        byParent = byId.Values.ToLookup(section => section.ParentId);
    }

    public TestSection? Find(TestSectionId id) => byId.GetValueOrDefault(id);

    public IReadOnlyList<TestSectionId> Subtree(TestSectionId id)
    {
        var result = new List<TestSectionId>();
        var pending = new Stack<TestSectionId>([id]);
        while (pending.TryPop(out var current))
        {
            result.Add(current);
            foreach (var child in byParent[current])
            {
                pending.Push(child.Id);
            }
        }

        return result;
    }

    public int Depth(TestSectionId id)
    {
        var depth = 0;
        for (
            var current = byId.GetValueOrDefault(id);
            current is not null;
            current = current.ParentId is { } parentId ? byId.GetValueOrDefault(parentId) : null
        )
        {
            depth++;
        }

        return depth;
    }

    public int NextPosition(TestSectionId? parentId) =>
        byParent[parentId].Select(section => section.Position).DefaultIfEmpty(0).Max() + 1;

    public void EnsureCanAdd(TestSectionId? parentId)
    {
        if (parentId is { } parent && Depth(parent) + 1 > MaxDepth)
        {
            throw TooDeep();
        }
    }

    public void EnsureCanMove(TestSectionId id, TestSectionId? parentId)
    {
        if (parentId is not { } parent)
        {
            return;
        }

        if (Subtree(id).Contains(parent))
        {
            throw new DomainException("A section can't move into itself or one of its subsections")
            {
                ErrorCode = DomainErrorCodes.SectionCycle,
            };
        }

        if (Depth(parent) + Height(id) > MaxDepth)
        {
            throw TooDeep();
        }
    }

    private int Height(TestSectionId id) =>
        1 + byParent[id].Select(child => Height(child.Id)).DefaultIfEmpty(0).Max();

    private static DomainException TooDeep() =>
        new($"Sections can't be nested more than {MaxDepth} levels deep")
        {
            ErrorCode = DomainErrorCodes.SectionTooDeep,
        };
}
