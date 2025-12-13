import { C as CommonCreateBlobOptions, B as BlobError, a as BlobCommandOptions, P as PutBody, b as PutBlobResult, c as Part, U as UploadPartCommandOptions, d as CompleteMultipartUploadCommandOptions } from './helpers-BfcvAwfQ.js';
export { e as PartInput, g as getDownloadUrl } from './helpers-BfcvAwfQ.js';
import 'stream';

interface PutCommandOptions extends CommonCreateBlobOptions {
    /**
     * Whether to use multipart upload. Use this when uploading large files. It will split the file into multiple parts, upload them in parallel and retry failed parts.
     * @defaultvalue false
     */
    multipart?: boolean;
}

declare class BlobAccessError extends BlobError {
    constructor();
}
declare class BlobStoreNotFoundError extends BlobError {
    constructor();
}
declare class BlobStoreSuspendedError extends BlobError {
    constructor();
}
declare class BlobUnknownError extends BlobError {
    constructor();
}
declare class BlobNotFoundError extends BlobError {
    constructor();
}
declare class BlobServiceNotAvailable extends BlobError {
    constructor();
}
declare class BlobServiceRateLimited extends BlobError {
    readonly retryAfter: number;
    constructor(seconds?: number);
}
declare class BlobRequestAbortedError extends BlobError {
    constructor();
}

/**
 * Deletes one or multiple blobs from your store.
 * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#delete-a-blob
 *
 * @param url - Blob url or array of blob urls that identify the blobs to be deleted. You can only delete blobs that are located in a store, that your 'BLOB_READ_WRITE_TOKEN' has access to.
 * @param options - Additional options for the request.
 */
declare function del(url: string[] | string, options?: BlobCommandOptions): Promise<void>;

interface HeadBlobResult {
    url: string;
    downloadUrl: string;
    size: number;
    uploadedAt: Date;
    pathname: string;
    contentType: string;
    contentDisposition: string;
    cacheControl: string;
}
/**
 * Fetches metadata of a blob object.
 * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#get-blob-metadata
 *
 * @param url - Blob url to lookup.
 * @param options - Additional options for the request.
 */
declare function head(url: string, options?: BlobCommandOptions): Promise<HeadBlobResult>;

interface ListBlobResultBlob {
    url: string;
    downloadUrl: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
}
interface ListBlobResult {
    blobs: ListBlobResultBlob[];
    cursor?: string;
    hasMore: boolean;
}
interface ListFoldedBlobResult extends ListBlobResult {
    folders: string[];
}
interface ListCommandOptions<M extends 'expanded' | 'folded' | undefined = undefined> extends BlobCommandOptions {
    /**
     * The maximum number of blobs to return.
     * @defaultvalue 1000
     */
    limit?: number;
    /**
     * Filters the result to only include blobs that start with this prefix.
     * If used together with `mode: 'folded'`, make sure to include a trailing slash after the foldername.
     */
    prefix?: string;
    /**
     * The cursor to use for pagination. Can be obtained from the response of a previous `list` request.
     */
    cursor?: string;
    /**
     * Defines how the blobs are listed
     * - `expanded` the blobs property contains all blobs.
     * - `folded` the blobs property contains only the blobs at the root level of your store. Blobs that are located inside a folder get merged into a single entry in the folder response property.
     * @defaultvalue 'expanded'
     */
    mode?: M;
}
type ListCommandResult<M extends 'expanded' | 'folded' | undefined = undefined> = M extends 'folded' ? ListFoldedBlobResult : ListBlobResult;
/**
 * Fetches a paginated list of blob objects from your store.
 * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#list-blobs
 *
 * @param options - Additional options for the request.
 */
declare function list<M extends 'expanded' | 'folded' | undefined = undefined>(options?: ListCommandOptions<M>): Promise<ListCommandResult<M>>;

type CopyCommandOptions = CommonCreateBlobOptions;
interface CopyBlobResult {
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    contentDisposition: string;
}
/**
 * Copies a blob to another location in your store.
 * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#copy-a-blob
 *
 * @param fromUrl - The blob URL to copy. You can only copy blobs that are in the store, that your 'BLOB_READ_WRITE_TOKEN' has access to.
 * @param toPathname - The pathname to copy the blob to. This includes the filename.
 * @param options - Additional options. The copy method will not preserve any metadata configuration (e.g.: 'cacheControlMaxAge') of the source blob. If you want to copy the metadata, you need to define it here again.
 */
declare function copy(fromUrl: string, toPathname: string, options: CopyCommandOptions): Promise<CopyBlobResult>;

/**
 * Uploads a blob into your store from your server.
 * Detailed documentation can be found here: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#upload-a-blob
 *
 * If you want to upload from the browser directly, check out the documentation for client uploads: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#client-uploads
 *
 * @param pathname - The pathname to upload the blob to. For file upload this includes the filename. Pathnames that end with a slash are treated as folder creations.
 * @param bodyOrOptions - Either the contents of your blob or the options object. For file uploads this has to be a supported fetch body type https://developer.mozilla.org/en-US/docs/Web/API/fetch#body. For folder creations this is the options object since no body is required.
 * @param options - Additional options like `token` or `contentType` for file uploads. For folder creations this argument can be ommited.
 */
declare const put: <TPath extends string>(pathname: TPath, bodyOrOptions: TPath extends `${string}/` ? PutCommandOptions : PutBody, optionsInput?: (TPath extends `${string}/` ? never : PutCommandOptions) | undefined) => Promise<PutBlobResult>;

declare const createMultipartUpload: (pathname: string, optionsInput: CommonCreateBlobOptions) => Promise<{
    key: string;
    uploadId: string;
}>;
declare const createMultipartUploader: (pathname: string, optionsInput: CommonCreateBlobOptions) => Promise<{
    key: string;
    uploadId: string;
    uploadPart(partNumber: number, body: PutBody): Promise<{
        etag: string;
        partNumber: number;
    }>;
    complete(parts: Part[]): Promise<PutBlobResult>;
}>;

declare const uploadPart: (pathname: string, body: PutBody, optionsInput: UploadPartCommandOptions) => Promise<Part>;

declare const completeMultipartUpload: (pathname: string, parts: Part[], optionsInput: CompleteMultipartUploadCommandOptions) => Promise<PutBlobResult>;

export { BlobAccessError, BlobError, BlobNotFoundError, BlobRequestAbortedError, BlobServiceNotAvailable, BlobServiceRateLimited, BlobStoreNotFoundError, BlobStoreSuspendedError, BlobUnknownError, CompleteMultipartUploadCommandOptions, type CopyBlobResult, type CopyCommandOptions, type HeadBlobResult, type ListBlobResult, type ListBlobResultBlob, type ListCommandOptions, type ListFoldedBlobResult, Part, PutBlobResult, type PutCommandOptions, UploadPartCommandOptions, completeMultipartUpload, copy, createMultipartUpload, createMultipartUploader, del, head, list, put, uploadPart };
