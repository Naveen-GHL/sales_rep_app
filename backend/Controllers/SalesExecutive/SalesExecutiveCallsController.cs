using backend.DTOs.Calls;
using backend.DTOs.Common;
using backend.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.SalesExecutive;

[ApiController, Authorize(Roles = "sales_executive"), Route("api/sales-executive/calls")]
public sealed class SalesExecutiveCallsController(ICallService service, IValidator<LogCallDto> logValidator, IValidator<CallDispositionDto> dispositionValidator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? direction = null, [FromQuery] string? disposition = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, CancellationToken cancellationToken = default) => Ok(ApiResponse<PagedResult<CallRecordDto>>.SuccessResult(await service.GetAsync(page, pageSize, direction, disposition, from, to, cancellationToken)));
    [HttpPost] public async Task<IActionResult> Log(LogCallDto request, CancellationToken cancellationToken) { var v = await logValidator.ValidateAsync(request, cancellationToken); if (!v.IsValid) return BadRequest(v.Errors.Select(x => x.ErrorMessage)); return Ok(await service.LogAsync(request, cancellationToken)); }
    [HttpPost("disposition")] public async Task<IActionResult> Disposition(CallDispositionDto request, CancellationToken cancellationToken) { var v = await dispositionValidator.ValidateAsync(request, cancellationToken); if (!v.IsValid) return BadRequest(v.Errors.Select(x => x.ErrorMessage)); return Ok(await service.ProcessDispositionAsync(request, cancellationToken)); }
}
