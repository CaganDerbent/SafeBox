using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using backend.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using backend.Models;
using Amazon.S3.Model.Internal.MarshallTransformations;

namespace backend.Services
{
    public class S3Service : IS3Service
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public S3Service(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _bucketName = configuration.GetValue<string>("AWS:BucketName");
        }

        public async Task<string> UploadFileAsync(IFormFile file,string fileKey)
        {
            var fileTransferUtility = new TransferUtility(_s3Client);

            using (var newMemoryStream = new MemoryStream())
            {
                await file.CopyToAsync(newMemoryStream);
                newMemoryStream.Position = 0;

                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = newMemoryStream,
                    Key = fileKey,
                    BucketName = _bucketName,
                    ContentType = file.ContentType
                };

                await fileTransferUtility.UploadAsync(uploadRequest);
            }

            return fileKey;
        }


        public async Task<List<FileDTO>> ListRootFileAsync(string Id, bool rootOnly)
        {
            string prefix = "users/" + Id + "/";

            var request = new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix, 
                Delimiter = rootOnly ? "/" : null 
            };

            var response = await _s3Client.ListObjectsV2Async(request);

            List<FileDTO> files = new List<FileDTO>();

             if (rootOnly)
    {
        foreach (var commonPrefix in response.CommonPrefixes)
        {
            files.Add(new FileDTO
            {
                Name = commonPrefix.Replace(prefix, ""),
                Size = 0, 
                LastModified = null  
            });
        }
    }

    foreach (var obj in response.S3Objects)
    {
        if (obj.Key != prefix)
        {
            files.Add(new FileDTO
            {
                Name = obj.Key.Replace(prefix, ""),
                Size = obj.Size,
                LastModified = obj.LastModified
            });
        }
    }
            

            return files;
        }

        public async Task<List<FileDTO>> ListFilesAsync(string Id)
        {
            string prefix = "users/" + Id.ToString() + "/";

            var request = new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix
            };

            var response = await _s3Client.ListObjectsV2Async(request);

            List<FileDTO> files = new List<FileDTO>();
            foreach (var obj in response.S3Objects)
            {
                if (obj.Key != prefix)
                {
                    files.Add(new FileDTO
                    {
                        Name = obj.Key.Replace(prefix, ""),
                        Size = obj.Size,
                        LastModified = obj.LastModified
                    });
                }
            }

            return files;
        }

        public async Task<List<FileDTO>> ListSpecificFileAsync(string Id, string filename)
        {
            string prefix = "users/" + $"{Id}/{filename}";
            
            var request = new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix,
                Delimiter = "/"
            };

            var response = await _s3Client.ListObjectsV2Async(request);
            List<FileDTO> files = new List<FileDTO>();

            foreach (var commonPrefix in response.CommonPrefixes)
            {
                var folderName = commonPrefix.Replace(prefix, "").TrimEnd('/');
                if (!string.IsNullOrEmpty(folderName))
                {
                    files.Add(new FileDTO
                    {
                        Name = folderName + "/",
                        Size = 0,
                        LastModified = null,
                        IsFolder = true
                    });
                }
            }

            foreach (var obj in response.S3Objects)
            {
                if (obj.Key.EndsWith("/")) continue;
                
                var objName = obj.Key.Replace(prefix, "");
                if (!string.IsNullOrEmpty(objName) && !objName.Contains("/"))
                {
                    files.Add(new FileDTO
                    {
                        Name = objName,
                        Size = obj.Size,
                        LastModified = obj.LastModified,
                        IsFolder = false
                    });
                }
            }

            return files;
        }

        public async Task<Stream> DownloadFileAsync(string fileKey)
        {
            try
            {
                var response = await _s3Client.GetObjectAsync(_bucketName, fileKey);
                var memoryStream = new MemoryStream();
                await response.ResponseStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                return memoryStream;
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                Console.WriteLine($"File not found: {fileKey}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error downloading file: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileKey)
        {
            try
            {
                var deleteObjectRequest = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileKey
                };

                await _s3Client.DeleteObjectAsync(deleteObjectRequest);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> CreateUniqueFolder(int Id)
        {
            try
            {     
                string folderKey = "users/" + Id.ToString() + "/"; 

                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = folderKey,
                    ContentBody = string.Empty
                };

                await _s3Client.PutObjectAsync(putRequest);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> CreateFolder(string fileKey)
        {
            try
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileKey,
                    ContentBody = string.Empty
                };

                await _s3Client.PutObjectAsync(putRequest);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> BackupFolder(string userId)
        {
            try
            {
                var listRequest = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    Prefix = "backup/users_",
                    Delimiter = "/"
                };

                var response = await _s3Client.ListObjectsV2Async(listRequest);
                
                if (!response.CommonPrefixes.Any())
                {
                    return false;
                }

                var latestBackup = response.CommonPrefixes
                    .OrderByDescending(p => p)
                    .First();

                var userPrefix = $"users/{userId}/";
                var listUserFilesRequest = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    Prefix = userPrefix
                };

                var userFiles = await _s3Client.ListObjectsV2Async(listUserFilesRequest);
                foreach (var file in userFiles.S3Objects)
                {
                    await DeleteFileAsync(file.Key);
                }

                var backupPrefix = $"{latestBackup}{userId}/";
                var backupFilesRequest = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    Prefix = backupPrefix
                };

                var backupFiles = await _s3Client.ListObjectsV2Async(backupFilesRequest);
                foreach (var file in backupFiles.S3Objects)
                {
                    if (file.Key.EndsWith("/")) continue;

                    var destinationKey = file.Key.Replace(backupPrefix, userPrefix);
                    
                    var copyRequest = new CopyObjectRequest
                    {
                        SourceBucket = _bucketName,
                        SourceKey = file.Key,
                        DestinationBucket = _bucketName,
                        DestinationKey = destinationKey
                    };

                    await _s3Client.CopyObjectAsync(copyRequest);
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in BackupFolder: {ex.Message}");
                return false;
            }
        }



    }
}
