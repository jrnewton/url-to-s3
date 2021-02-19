'use strict';

const debug = require('debug')('url-to-s3:debug');
const verbose = require('debug')('url-to-s3:verbose');

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const Axios = require('axios');
const Stream = require('stream');

let s3Client = null;

/**
 * @param {string} url - required.
 * @param {string} bucketName - required.
 * @param {string} objectName - optional.  Use resource name in url.
 * @param {string} region - required unless client already defined.
 */
const main = async (url, bucketName, objectName, region) => {
  debug('enter url-to-s3');

  if (!s3Client) {
    debug('creating S3 client');
    s3Client = new S3Client({ apiVersion: '2006-03-01', region: region });
    verbose('S3 client', s3Client);
  }

  if (!objectName) {
    debug('setting objectName from url');
    objectName = url.slice(url.lastIndexOf('/') + 1);
    verbose('objectName', objectName);
  }

  //check to see if object is already in the bucket.
  const headCommand = new HeadObjectCommand({
    Bucket: bucketName,
    Key: objectName
  });

  try {
    debug('checking for existing object');
    const headResponse = await s3Client.send(headCommand);
    verbose('S3 head response', headResponse);
    if (headResponse.$metadata.httpStatusCode === 200) {
      //its already there - bail now
      debug('existing object found');
      debug('exit url-to-s3');
      return { Bucket: bucketName, Key: objectName };
    }
  } catch (error) {
    //object aint there, keep going
    debug('existing object not found');
  }

  let response = null;
  try {
    debug('fetching resource at', url);
    response = await Axios.get(url, {
      responseType: 'stream'
    });
    debug('fetch complete');
  } catch (error) {
    debug('fetch failed');
    verbose('axios GET error', error);
    let msg = '';
    if (error.message) {
      msg += ` ${error.status} (${error.statusText})`;
    } else {
      msg += JSON.stringify(error);
    }
    debug('exit url-to-s3');
    throw new Error(msg);
  }

  //setup the passthrough from download pipe to S3 upload pipe.
  let pass = new Stream.PassThrough();
  response.data.pipe(pass);

  //V3 does not support body passthrough, so use Upload as workaround.
  //See https://github.com/aws/aws-sdk-js-v3/issues/1920
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: objectName,
      Body: pass
    }
  });

  try {
    const s3Response = await upload.done();
    debug('S3 upload complete');
    verbose('S3 response', s3Response);

    debug('exit url-to-s3');
    return { Bucket: s3Response.Bucket, Key: s3Response.Key };
  } catch (error) {
    debug('S3 upload failed');
    verbose('S3 upload error', error);
    throw error;
  }
};

module.exports.client = s3Client;
module.exports.default = main;
