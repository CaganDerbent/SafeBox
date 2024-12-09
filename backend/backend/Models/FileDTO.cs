namespace backend.Models
{
    public class FileDTO
    {
        public string Name { get; set; }
        public long Size { get; set; }
        public DateTime? LastModified { get; set; }
        public bool IsFolder { get; set; }
    }
}
