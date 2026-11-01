using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Dashboard;

namespace TestCraft.Api.Features.Dashboard;

[Route("api/v{version:apiVersion}/dashboard")]
public class DashboardController(ISender sender) : ApiControllerBase
{
    /// <summary>Summarizes testing activity across projects visible to the current user.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetDashboardSummary.Query(), cancellationToken));
}
