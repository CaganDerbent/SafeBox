using backend.Models;

namespace backend.Interfaces
{
    public interface IS3Service
    {
        Task<string> UploadFileAsync(IFormFile file,string fileKey);
        Task<List<FileDTO>> ListRootFileAsync(string Id,bool rootOnly);

        Task<List<FileDTO>> ListFilesAsync(string Id);
        Task<List<FileDTO>> ListSpecificFileAsync(string Id,string filename);
        Task<Stream> DownloadFileAsync(string fileKey);
        Task<bool> DeleteFileAsync(string fileKey);
        Task<bool> CreateUniqueFolder(int userId);
        Task<bool> CreateFolder(string fileKey);
        Task<bool> BackupFolder(string fileKey);
    }
}
