using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TestCraft.Api;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
public abstract class ApiControllerBase : ControllerBase;
