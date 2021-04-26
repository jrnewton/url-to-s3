'use strict';

const debug = require('debug')('url-to-s3:debug');
const verbose = require('debug')('url-to-s3:verbose');

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const Axios = require('axios');
const Stream = require('stream');

/**
 * @typedef {Object} ReturnValue
 * @property {string} location
 * @property {Object} response - the S3 response object.
 *
 * @param {Object} params - AWS params (required).
 * @param {string} params.region - S3 region (required).
 * @param {string} params.bucketName - S3 bucket name (required).
 * @param {string} params.objectName - S3 object name (optional).  Default to URL resource name.
 * @param {string} url - Resource to capture (required).
 * @param {boolean} replace - Replace an existing object (optional)?  Defaults to true.
 * @returns {(null|ReturnValue)} - return null if replace=false and object already exists, otherwise {ReturnValue}.
 * @throws throws an error when failing to download or upload the resource.
 */
const main = async (params, url, replace = true) => {
  debug('enter url-to-s3');

  const region = params.region;
  const bucketName = params.bucketName;
  const objectName = params.objectName || url.slice(url.lastIndexOf('/') + 1);

  const s3Client = new S3Client({ apiVersion: '2006-03-01', region: region });
  debug('S3 client created');
  verbose('S3 client', s3Client);

  if (!replace) {
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
        return null;
      }
    } catch (error) {
      //object aint there, keep going
      debug('existing object not found');
    }
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
    return {
      location: s3Response.Location,
      response: s3Response
    };
  } catch (error) {
    debug('S3 upload failed');
    verbose('S3 upload error', error);
    throw error;
  }
};

module.exports.default = main;
