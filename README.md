# url-to-s3

Store the resource pointed to by a url in an S3 bucket.

### Example

```
const urlToS3 = require('./index').default;

(async () => {
  try {
    const result = await urlToS3(
      'us-east-2',
      'https://imgs.xkcd.com/comics/the_cloud.png',
      'xkcd-archive'
    );
    console.log(result);
  } catch (error) {
    console.error(error);
  }
})();
```