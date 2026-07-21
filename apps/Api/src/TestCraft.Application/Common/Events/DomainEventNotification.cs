using MediatR;
using TestCraft.Domain.Events;

namespace TestCraft.Application.Common.Events;

/// <summary>Bridges a domain event to MediatR's INotification so Domain stays framework-free.</summary>
public sealed class DomainEventNotification<TDomainEvent>(TDomainEvent domainEvent) : INotification
    where TDomainEvent : IDomainEvent
{
    public TDomainEvent DomainEvent { get; } = domainEvent;
}
