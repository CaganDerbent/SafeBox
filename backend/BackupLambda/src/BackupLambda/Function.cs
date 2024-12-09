using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace BackupLambda;

public class Function
{
    private static readonly string bucketName = "backupsystembucket";
    private static readonly string sourcePrefix = "users/";


    private static readonly string destinationPrefix = "backup/users_" + DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss") + "/";

    private readonly IAmazonS3 _s3Client = new AmazonS3Client();

    public async Task FunctionHandler(ILambdaContext context)
    {
        try
        {
            var listRequest = new ListObjectsV2Request
            {
                BucketName = bucketName,
                Prefix = sourcePrefix
            };

            ListObjectsV2Response listResponse;
            do
            {
                listResponse = await _s3Client.ListObjectsV2Async(listRequest);
                foreach (var s3Object in listResponse.S3Objects)
                {
                    var destinationKey = s3Object.Key.Replace(sourcePrefix, destinationPrefix);
                    var copyRequest = new CopyObjectRequest
                    {
                        SourceBucket = bucketName,
                        SourceKey = s3Object.Key,
                        DestinationBucket = bucketName,
                        DestinationKey = destinationKey
                    };

                    await _s3Client.CopyObjectAsync(copyRequest);
                    context.Logger.LogLine($"Copied {s3Object.Key} to {destinationKey}");
                }

                listRequest.ContinuationToken = listResponse.NextContinuationToken;
            } while (listResponse.IsTruncated);
        }
        catch (Exception e)
        {
            context.Logger.LogLine($"Error: {e.Message}");
        }
    }
}