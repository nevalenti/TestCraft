using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Common.Exceptions;

namespace TestCraft.Api;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
public abstract class ApiControllerBase : ControllerBase
{
    protected static int ExpectedVersion(string ifMatch)
    {
        var value = ifMatch.Trim();
        if (
            value.Length < 3
            || value[0] != '"'
            || value[^1] != '"'
            || !int.TryParse(value.AsSpan(1, value.Length - 2), out var version)
            || version < 0
        )
        {
            throw new PreconditionFailedException("If-Match must be an ETag returned by this API");
        }

        return version;
    }

    protected void SetETag(int version) => Response.Headers.ETag = $"\"{version}\"";
}
