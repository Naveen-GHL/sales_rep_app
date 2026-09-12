namespace backend.DTOs.Auth;

public class TenantDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string BrandColor { get; set; } = string.Empty;
    public string? Logo { get; set; }
    public string Tagline { get; set; } = string.Empty;
    public List<string> EnabledFeatures { get; set; } = new();
    public string Timezone { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public string BusinessHours { get; set; } = string.Empty;
}
