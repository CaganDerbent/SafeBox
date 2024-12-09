using Microsoft.AspNetCore.Mvc;
using Amazon.S3;
using Amazon.S3.Model;
using AWSSDK.Runtime;
using backend.Services;
using backend.Interfaces;
using backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("/api/file")]
    [Authorize]
    public class FileController : Controller
    {
        private readonly IS3Service _s3Service;

        public FileController(IS3Service s3Service)
        {
            _s3Service = s3Service;
        }

        [HttpPost("upload/{userId}/{*fileName}")]
        public async Task<IActionResult> UploadFile(IFormFile file,string userId,string fileName)
        {
            var fileKey = "users/" + $"{userId}/{fileName}";

            if (file == null || file.Length == 0)
            {
                return BadRequest("File not found.");
            }
            var s3Key = await _s3Service.UploadFileAsync(file,fileKey);

            return Ok(new { Message = "File uploaded successfuly.", FileKey = s3Key });
        }

        [HttpGet("files")]
        public async Task<IActionResult> ListFiles([FromQuery] string id)
        {
 
            var files = await _s3Service.ListFilesAsync(id);
            return Ok(files);
        }

        [HttpGet("rootfile")]
        public async Task<IActionResult> ListRootFile([FromQuery] string id)
        {
            bool rootOnly = true;
            var files = await _s3Service.ListRootFileAsync(id, rootOnly);
            return Ok(files);
        }

        [HttpGet("specificfile")]
        public async Task<IActionResult> ListSpecificFile([FromQuery] string id, string filename)
        {
            if (!filename.EndsWith("/"))
            {
                filename += "/";
            }
            
            var files = await _s3Service.ListSpecificFileAsync(id, filename);
            return Ok(files);
        }



        [HttpGet("download/{userId}/{*fileName}")]
        public async Task<IActionResult> DownloadFile(string userId, string fileName)
        {
            var fileKey = $"{userId}/{fileName}";
            
            var fileStream = await _s3Service.DownloadFileAsync(fileKey);

            if (fileStream == null)
            {
                return NotFound("File not found.");
            }

            var actualFileName = Path.GetFileName(fileName);
            return File(fileStream, "application/octet-stream", actualFileName);
        }

        [HttpDelete("delete/{userId}/{*fileName}")]
        public async Task<IActionResult> DeleteFile(string userId, string fileName)
        {
            var fileKey = "users/" + $"{userId}/{fileName}";
            
            var result = await _s3Service.DeleteFileAsync(fileKey);
            if (!result)
            {
                return NotFound("File not found.");
            }

            return Ok(new { Message = "File deleted successfully." });
        }

        [HttpPost("folder/{userId}/{*fileName}")]
        public async Task<IActionResult> CreateFolder(string userId, string fileName)
        {
            var fileKey = "users/" + $"{userId}/{fileName}";

           
            var s3Key = await _s3Service.CreateFolder(fileKey);

            return Ok(new { Message = "Folder created successfully.", FileKey = s3Key });
        }

        [HttpPost("restore/{userId}")]
        public async Task<IActionResult> RestoreFromBackup(string userId)
        {
            try
            {

                var result = await _s3Service.BackupFolder(userId);
                if (!result)
                {
                    return NotFound("No backups found or restore failed");
                }

                return Ok(new { Message = "Backup restored successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error restoring backup: {ex.Message}");
            }
        }

    }
}
