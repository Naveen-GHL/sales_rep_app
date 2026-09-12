using backend.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(r => r.Code)
            .IsUnique();

        builder.Property(r => r.Permissions)
            .HasColumnType("text[]")
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .HasDefaultValueSql("NOW()");
    }
}
