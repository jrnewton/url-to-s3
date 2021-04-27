'use strict';

const { default: urlToS3, createClient } = require('./index');

(async () => {
  try {
    //setup client outside of loop
    createClient();

    const images = [
      'https://imgs.xkcd.com/comics/fully_vaccinated.png',
      'https://imgs.xkcd.com/comics/excel_lambda.png',
      'https://imgs.xkcd.com/comics/aviation_firsts.png'
    ];

    for (const url of images) {
      const result = await urlToS3({ bucketName: 'xkcd-archive' }, url);
      console.log('location of object', result.location);
    }
  } catch (error) {
    console.warn(error);
  }
})();
