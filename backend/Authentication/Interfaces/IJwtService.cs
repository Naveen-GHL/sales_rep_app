using backend.Models.Entities;

namespace backend.Authentication.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
