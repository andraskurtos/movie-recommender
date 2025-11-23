using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Movie> Movies => Set<Movie>();
        public DbSet<Genre> Genres => Set<Genre>();
        public DbSet<User> Users => Set<User>();
        public DbSet<UserRating> UserRatings => Set<UserRating>();
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

                // Configure many-to-many relationship between Movie and Genre
                modelBuilder.Entity<Movie>()
                    .HasMany(m => m.Genres)
                    .WithMany(g => g.Movies)
                    .UsingEntity<Dictionary<string, object>>(
                        "MovieGenre",
                        j => j.HasOne<Genre>().WithMany().HasForeignKey("GenreId").HasConstraintName("FK_MovieGenre_GenreId").OnDelete(DeleteBehavior.Cascade),
                        j => j.HasOne<Movie>().WithMany().HasForeignKey("MovieId").HasConstraintName("FK_MovieGenre_MovieId").OnDelete(DeleteBehavior.Cascade));
                
                modelBuilder.Entity<Movie>()
                    .HasIndex(m => m.Title)
                    .HasMethod("gin")
                    .HasOperators("gin_trgm_ops")
                    .HasDatabaseName("IX_Movie_Title_trgm");
        }
    }
    
}
