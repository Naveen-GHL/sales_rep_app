namespace backend.Models.Entities;

public class Lead
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
