using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TestCraft.Api.Configuration.Authentication;

namespace TestCraft.Api.Features.System;

[ApiController]
[ApiVersionNeutral]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("api")]
public class AuthConfigController(IOptions<KeycloakAuthOptions> keycloakOptions) : ControllerBase
{
    /// <summary>Gets the Keycloak authority used by clients to authenticate.</summary>
    [HttpGet("auth-config")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<AuthConfigResponse> GetAuthConfig()
    {
        return Ok(new AuthConfigResponse(keycloakOptions.Value.KeycloakAuthority));
    }
}
