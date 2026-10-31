using System.ComponentModel;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using TestCraft.Application.Common.Requests;

namespace TestCraft.Api.Configuration.Controllers;

internal sealed class SnakeCaseQueryBindingProvider : IBindingMetadataProvider
{
    public void CreateBindingMetadata(BindingMetadataProviderContext context)
    {
        if (context.Key.Name is null || !IsOwnModel(context.Key))
        {
            return;
        }

        if (context.PropertyAttributes?.OfType<RouteValueAttribute>().Any() == true)
        {
            context.BindingMetadata.IsBindingAllowed = false;
            context.BindingMetadata.BindingSource = BindingSource.Special;
            return;
        }

        var isQueryParameter =
            context.Key.MetadataKind == ModelMetadataKind.Parameter
            && context.BindingMetadata.BindingSource == BindingSource.Query
            && TypeDescriptor.GetConverter(context.Key.ModelType).CanConvertFrom(typeof(string));

        if (
            (context.Key.MetadataKind == ModelMetadataKind.Property || isQueryParameter)
            && context.BindingMetadata.BinderModelName is null
        )
        {
            context.BindingMetadata.BinderModelName = WireFormat.NamingPolicy.ConvertName(
                context.Key.Name
            );
        }
    }

    private static bool IsOwnModel(ModelMetadataIdentity key)
    {
        var declaringType =
            key.MetadataKind == ModelMetadataKind.Parameter
                ? key.ParameterInfo?.Member.DeclaringType
                : key.ContainerType;

        return declaringType?.Namespace?.StartsWith("TestCraft.", StringComparison.Ordinal) == true
            && !declaringType.Namespace.StartsWith("TestCraft.Domain", StringComparison.Ordinal);
    }
}
