using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Username { get; set; } = "";

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = "";

        [StringLength(255)]
        public string? DisplayName { get; set; }

        [StringLength(255)]
        public string? ProfilePictureUrl { get; set; }

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        public ICollection<UserRating> Ratings { get; set; } = new List<UserRating>();
    }
}