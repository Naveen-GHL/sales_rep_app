namespace backend.Models.Entities;

public class Followup
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int UserId { get; set; }
    public int? LeadId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Notes { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
