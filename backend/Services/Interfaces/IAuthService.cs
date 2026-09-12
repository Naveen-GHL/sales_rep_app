using backend.DTOs.Auth;
using backend.DTOs.Common;

namespace backend.Services.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
