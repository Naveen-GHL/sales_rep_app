using backend.Data;
using backend.DTOs.Calls;
using backend.DTOs.Common;
using backend.Models.Entities;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public sealed class CallService(ApplicationDbContext context, ICurrentUserService currentUser) : ICallService
{
    public async Task<PagedResult<CallRecordDto>> GetAsync(int page, int pageSize, string? direction, string? disposition, DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = context.Set<CallRecord>().AsNoTracking().Where(x => x.CompanyId == currentUser.CompanyId && x.AgentId == currentUser.UserId);
        if (!string.IsNullOrWhiteSpace(direction)) query = query.Where(x => x.Direction == direction.ToLower());
        if (!string.IsNullOrWhiteSpace(disposition)) query = query.Where(x => x.Disposition == disposition);
        if (from.HasValue) query = query.Where(x => x.StartedAt >= from.Value.ToUniversalTime());
        if (to.HasValue) query = query.Where(x => x.StartedAt <= to.Value.ToUniversalTime());
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.StartedAt).Skip((page - 1) * pageSize).Take(pageSize).Select(x => new CallRecordDto { Id = x.Id, ContactName = x.ContactName, ContactPhone = x.ContactPhone, Direction = x.Direction, Duration = x.DurationSeconds, Disposition = x.Disposition, Notes = x.Notes, LeadId = x.LeadId, CustomerId = x.CustomerId, StartedAt = x.StartedAt }).ToListAsync(cancellationToken);
        return new PagedResult<CallRecordDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<ApiResponse<CallRecordDto>> LogAsync(LogCallDto request, CancellationToken cancellationToken)
    {
        var record = new CallRecord { CompanyId = currentUser.CompanyId, AgentId = currentUser.UserId, ContactName = request.ContactName, ContactPhone = request.ContactPhone, Direction = request.Direction.ToLowerInvariant(), DurationSeconds = request.Duration, Disposition = request.Disposition, Notes = request.Notes, LeadId = request.LeadId, CustomerId = request.CustomerId };
        context.Set<CallRecord>().Add(record); await context.SaveChangesAsync(cancellationToken);
        return ApiResponse<CallRecordDto>.SuccessResult(Map(record), "Call logged");
    }

    public async Task<ApiResponse<CallRecordDto>> ProcessDispositionAsync(CallDispositionDto request, CancellationToken cancellationToken)
    {
        CallRecord? record = request.CallId.HasValue ? await context.Set<CallRecord>().FirstOrDefaultAsync(x => x.Id == request.CallId && x.CompanyId == currentUser.CompanyId && x.AgentId == currentUser.UserId, cancellationToken) : null;
        if (record == null)
        {
            record = new CallRecord { CompanyId = currentUser.CompanyId, AgentId = currentUser.UserId, ContactName = request.ContactName, ContactPhone = request.ContactPhone, Direction = request.Direction.ToLowerInvariant(), DurationSeconds = request.Duration, LeadId = request.LeadId, CustomerId = request.CustomerId };
            context.Set<CallRecord>().Add(record);
        }
        record.Disposition = request.Disposition; record.Notes = request.Notes;
        if (request.LeadId.HasValue)
        {
            var lead = await context.Set<Lead>().FirstOrDefaultAsync(x => x.Id == request.LeadId && x.CompanyId == currentUser.CompanyId && x.AssignedToUserId == currentUser.UserId, cancellationToken);
            if (lead != null && request.Disposition is "Interested" or "Not Interested" or "Wrong Number") lead.Status = request.Disposition == "Wrong Number" ? "Junk" : request.Disposition;
            if (lead != null && request.Disposition is "Follow-up Required" or "Call Back") context.Set<Followup>().Add(new Followup { CompanyId = currentUser.CompanyId, UserId = currentUser.UserId, LeadId = lead.Id, ScheduledAt = request.FollowupAt ?? DateTime.UtcNow.AddDays(1), Notes = request.Notes });
        }
        await context.SaveChangesAsync(cancellationToken);
        return ApiResponse<CallRecordDto>.SuccessResult(Map(record), "Disposition processed");
    }

    private static CallRecordDto Map(CallRecord x) => new() { Id = x.Id, ContactName = x.ContactName, ContactPhone = x.ContactPhone, Direction = x.Direction, Duration = x.DurationSeconds, Disposition = x.Disposition, Notes = x.Notes, LeadId = x.LeadId, CustomerId = x.CustomerId, StartedAt = x.StartedAt };
}
