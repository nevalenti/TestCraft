using TestCraft.Domain.Events;

namespace TestCraft.Domain.Entities;

public abstract class AuditableEntity : IAuditableEntity, IHasDomainEvents
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public IReadOnlyList<IDomainEvent> PopDomainEvents()
    {
        var events = _domainEvents.ToList();
        _domainEvents.Clear();
        return events;
    }
}
