namespace backend.Models.Entities;

public class CallRecord
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int AgentId { get; set; }
    public int? LeadId { get; set; }
    public int? CustomerId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string Direction { get; set; } = "outbound";
    public int DurationSeconds { get; set; }
    public string Disposition { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
