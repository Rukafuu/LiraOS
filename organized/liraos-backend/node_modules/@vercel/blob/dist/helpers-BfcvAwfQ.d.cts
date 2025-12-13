import { Readable } from 'stream';

interface BlobCommandOptions {
    /**
     * Define your blob API token.
     * @defaultvalue process.env.BLOB_READ_WRITE_TOKEN
     */
    token?: string;
    /**
     * `AbortSignal` to cancel the running request. See https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
     */
    abortSignal?: AbortSignal;
}
interface CommonCreateBlobOptions extends BlobCommandOptions {
    /**
     * Whether the blob should be publicly accessible. Support for private blobs is planned.
     */
    access: 'public';
    /**
     * Adds a random suffix to the filename.
     * @defaultvalue true
     */
    addRandomSuffix?: boolean;
    /**
     * Defines the content type of the blob. By default, this value is inferred from the pathname. Sent as the 'content-type' header when downloading a blob.
     */
    contentType?: string;
    /**
     * Number in seconds to configure the edge and browser cache. The maximum values are 5 minutes for the edge cache and unlimited for the browser cache.
     * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob#caching
     * @defaultvalue 365 * 24 * 60 * 60 (1 Year)
     */
    cacheControlMaxAge?: number;
}
declare class BlobError extends Error {
    constructor(message: string);
}
declare function getDownloadUrl(blobUrl: string): string;

interface CommonCompleteMultipartUploadOptions {
    uploadId: string;
    key: string;
}
type CompleteMultipartUploadCommandOptions = CommonCompleteMultipartUploadOptions & CommonCreateBlobOptions;

interface CommonMultipartUploadOptions {
    uploadId: string;
    key: string;
    partNumber: number;
}
type UploadPartCommandOptions = CommonMultipartUploadOptions & CommonCreateBlobOptions;

interface PutBlobResult {
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    contentDisposition: string;
}
type PutBody = string | Readable | Buffer | Blob | ArrayBuffer | ReadableStream | File;

interface PartInput {
    partNumber: number;
    blob: PutBody;
}
interface Part {
    partNumber: number;
    etag: string;
}

export { BlobError as B, type CommonCreateBlobOptions as C, type PutBody as P, type UploadPartCommandOptions as U, type BlobCommandOptions as a, type PutBlobResult as b, type Part as c, type CompleteMultipartUploadCommandOptions as d, type PartInput as e, type CommonMultipartUploadOptions as f, getDownloadUrl as g, type CommonCompleteMultipartUploadOptions as h };
