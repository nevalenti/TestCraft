using FluentValidation;

namespace TestCraft.Application.Common.Pagination;

public sealed class PageQueryValidator<T> : AbstractValidator<T>
    where T : PageQuery
{
    public PageQueryValidator()
    {
        RuleFor(query => query.Page).InclusiveBetween(1, PageQuery.MaxPage);
        RuleFor(query => query.PageSize).InclusiveBetween(1, PaginationParams.MaxPageSize);
        RuleFor(query => query)
            .Must(query => (long)(query.Page - 1) * query.PageSize <= PageQuery.MaxOffset)
            .When(query => query.Page >= 1 && query.PageSize >= 1)
            .OverridePropertyName(nameof(PageQuery.Page))
            .WithMessage(
                $"Pages beyond the first {PageQuery.MaxOffset:N0} rows are not available; narrow the filter"
            );
    }
}

public sealed class SearchPageQueryValidator<T> : AbstractValidator<T>
    where T : SearchPageQuery
{
    public SearchPageQueryValidator()
    {
        RuleFor(query => query.Search).MaximumLength(SearchPageQuery.MaxSearchLength);
    }
}
