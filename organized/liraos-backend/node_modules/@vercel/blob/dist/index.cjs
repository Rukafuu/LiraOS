"use strict";Object.defineProperty(exports, "__esModule", {value: true});
















var _chunkZNLFOLE3cjs = require('./chunk-ZNLFOLE3.cjs');

// src/del.ts
async function del(url, options) {
  await _chunkZNLFOLE3cjs.requestApi.call(void 0, 
    "/delete",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ urls: Array.isArray(url) ? url : [url] }),
      signal: options == null ? void 0 : options.abortSignal
    },
    options
  );
}

// src/head.ts
async function head(url, options) {
  const searchParams = new URLSearchParams({ url });
  const response = await _chunkZNLFOLE3cjs.requestApi.call(void 0, 
    `?${searchParams.toString()}`,
    // HEAD can't have body as a response, so we use GET
    {
      method: "GET",
      signal: options == null ? void 0 : options.abortSignal
    },
    options
  );
  return {
    url: response.url,
    downloadUrl: response.downloadUrl,
    pathname: response.pathname,
    size: response.size,
    contentType: response.contentType,
    contentDisposition: response.contentDisposition,
    cacheControl: response.cacheControl,
    uploadedAt: new Date(response.uploadedAt)
  };
}

// src/list.ts
async function list(options) {
  var _a;
  const searchParams = new URLSearchParams();
  if (options == null ? void 0 : options.limit) {
    searchParams.set("limit", options.limit.toString());
  }
  if (options == null ? void 0 : options.prefix) {
    searchParams.set("prefix", options.prefix);
  }
  if (options == null ? void 0 : options.cursor) {
    searchParams.set("cursor", options.cursor);
  }
  if (options == null ? void 0 : options.mode) {
    searchParams.set("mode", options.mode);
  }
  const response = await _chunkZNLFOLE3cjs.requestApi.call(void 0, 
    `?${searchParams.toString()}`,
    {
      method: "GET",
      signal: options == null ? void 0 : options.abortSignal
    },
    options
  );
  if ((options == null ? void 0 : options.mode) === "folded") {
    return {
      folders: (_a = response.folders) != null ? _a : [],
      cursor: response.cursor,
      hasMore: response.hasMore,
      blobs: response.blobs.map(mapBlobResult)
    };
  }
  return {
    cursor: response.cursor,
    hasMore: response.hasMore,
    blobs: response.blobs.map(mapBlobResult)
  };
}
function mapBlobResult(blobResult) {
  return {
    url: blobResult.url,
    downloadUrl: blobResult.downloadUrl,
    pathname: blobResult.pathname,
    size: blobResult.size,
    uploadedAt: new Date(blobResult.uploadedAt)
  };
}

// src/copy.ts
async function copy(fromUrl, toPathname, options) {
  if (!options) {
    throw new (0, _chunkZNLFOLE3cjs.BlobError)("missing options, see usage");
  }
  if (options.access !== "public") {
    throw new (0, _chunkZNLFOLE3cjs.BlobError)('access must be "public"');
  }
  const headers = {};
  if (options.addRandomSuffix !== void 0) {
    headers["x-add-random-suffix"] = options.addRandomSuffix ? "1" : "0";
  }
  if (options.contentType) {
    headers["x-content-type"] = options.contentType;
  }
  if (options.cacheControlMaxAge !== void 0) {
    headers["x-cache-control-max-age"] = options.cacheControlMaxAge.toString();
  }
  const response = await _chunkZNLFOLE3cjs.requestApi.call(void 0, 
    `/${toPathname}?fromUrl=${fromUrl}`,
    {
      method: "PUT",
      headers,
      signal: options.abortSignal
    },
    options
  );
  return {
    url: response.url,
    downloadUrl: response.downloadUrl,
    pathname: response.pathname,
    contentType: response.contentType,
    contentDisposition: response.contentDisposition
  };
}

// src/index.ts
var put = _chunkZNLFOLE3cjs.createPutMethod.call(void 0, {
  allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "contentType"]
});
var createMultipartUpload = _chunkZNLFOLE3cjs.createCreateMultipartUploadMethod.call(void 0, {
  allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "contentType"]
});
var createMultipartUploader = _chunkZNLFOLE3cjs.createCreateMultipartUploaderMethod.call(void 0, {
  allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "contentType"]
});
var uploadPart = _chunkZNLFOLE3cjs.createUploadPartMethod.call(void 0, {
  allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "contentType"]
});
var completeMultipartUpload = _chunkZNLFOLE3cjs.createCompleteMultipartUploadMethod.call(void 0, {
  allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "contentType"]
});




















exports.BlobAccessError = _chunkZNLFOLE3cjs.BlobAccessError; exports.BlobError = _chunkZNLFOLE3cjs.BlobError; exports.BlobNotFoundError = _chunkZNLFOLE3cjs.BlobNotFoundError; exports.BlobRequestAbortedError = _chunkZNLFOLE3cjs.BlobRequestAbortedError; exports.BlobServiceNotAvailable = _chunkZNLFOLE3cjs.BlobServiceNotAvailable; exports.BlobServiceRateLimited = _chunkZNLFOLE3cjs.BlobServiceRateLimited; exports.BlobStoreNotFoundError = _chunkZNLFOLE3cjs.BlobStoreNotFoundError; exports.BlobStoreSuspendedError = _chunkZNLFOLE3cjs.BlobStoreSuspendedError; exports.BlobUnknownError = _chunkZNLFOLE3cjs.BlobUnknownError; exports.completeMultipartUpload = completeMultipartUpload; exports.copy = copy; exports.createMultipartUpload = createMultipartUpload; exports.createMultipartUploader = createMultipartUploader; exports.del = del; exports.getDownloadUrl = _chunkZNLFOLE3cjs.getDownloadUrl; exports.head = head; exports.list = list; exports.put = put; exports.uploadPart = uploadPart;
//# sourceMappingURL=index.cjs.map