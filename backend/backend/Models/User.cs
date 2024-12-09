using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Username { get; set; }
        [Required]
        public string HashedPassword { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime LastLogin { get; set; }
    }
}
