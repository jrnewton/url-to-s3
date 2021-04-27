# url-to-s3

Store the resource pointed to by a url in an S3 bucket.

### Examples

[Basic Example](example.js)
[Loop Example](example.js) - creates S3 client first for reuse in loop.

```
  const result = await urlToS3(
    { bucketName: 'xkcd-archive' },
    'https://imgs.xkcd.com/comics/the_cloud.png'
  );
```
