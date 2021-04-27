# url-to-s3

Store the resource pointed to by a url in an S3 bucket.

```
  const result = await urlToS3(
    { bucketName: 'xkcd-archive' },
    'https://imgs.xkcd.com/comics/the_cloud.png'
  );
```

### Examples

[Basic Example](./src/example.js)

[Loop Example](./src/example-loop.js) - creates S3 client first for reuse in a loop.
