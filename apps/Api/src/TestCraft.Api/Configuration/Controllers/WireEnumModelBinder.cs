using System.Collections.Frozen;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace TestCraft.Api.Configuration.Controllers;

internal sealed class WireEnumModelBinder(Type enumType) : IModelBinder
{
    private readonly FrozenDictionary<string, object> _values = Enum.GetValues(enumType)
        .Cast<Enum>()
        .ToFrozenDictionary(WireFormat.EnumName, value => (object)value, StringComparer.Ordinal);

    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var result = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
        if (result == ValueProviderResult.None || string.IsNullOrEmpty(result.FirstValue))
        {
            return Task.CompletedTask;
        }

        bindingContext.ModelState.SetModelValue(bindingContext.ModelName, result);

        if (_values.TryGetValue(result.FirstValue, out var value))
        {
            bindingContext.Result = ModelBindingResult.Success(value);
        }
        else
        {
            var allowed = string.Join(
                ", ",
                _values.Keys.Order(StringComparer.Ordinal).Select(name => $"'{name}'")
            );
            bindingContext.ModelState.TryAddModelError(
                bindingContext.ModelName,
                $"Input should be one of {allowed}"
            );
        }

        return Task.CompletedTask;
    }
}

internal sealed class WireEnumModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        var type =
            Nullable.GetUnderlyingType(context.Metadata.ModelType) ?? context.Metadata.ModelType;

        return type.IsEnum ? new WireEnumModelBinder(type) : null;
    }
}
