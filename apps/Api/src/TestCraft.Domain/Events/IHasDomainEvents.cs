namespace TestCraft.Domain.Events;

public interface IHasDomainEvents
{
    IReadOnlyList<IDomainEvent> PopDomainEvents();
}
