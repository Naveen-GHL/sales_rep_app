namespace backend.Services.Interfaces;

public interface ICurrentUserService
{
    int UserId { get; }
    int CompanyId { get; }
    bool IsAuthenticated { get; }
}
