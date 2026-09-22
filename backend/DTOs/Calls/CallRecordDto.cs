namespace backend.DTOs.Calls;

public class CallRecordDto
{
    public int Id { get; init; }
    public string ContactName { get; init; } = string.Empty;
    public string ContactPhone { get; init; } = string.Empty;
    public string Direction { get; init; } = string.Empty;
    public int Duration { get; init; }
    public string Disposition { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public int? LeadId { get; init; }
    public int? CustomerId { get; init; }
    public DateTime StartedAt { get; init; }
}
