'use strict';

const urlToS3 = require('./index').default;

(async () => {
  try {
    const result = await urlToS3(
      { region: 'us-east-2', bucketName: 'xkcd-archive' },
      'https://imgs.xkcd.com/comics/the_cloud.png'
    );
    console.log('location of object', result.location);
    console.debug('full S3 response', result.response);
  } catch (error) {
    console.warn(error);
  }
})();
