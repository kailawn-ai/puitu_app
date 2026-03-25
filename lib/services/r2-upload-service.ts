import { apiClient, type UploadFileInput } from "@/lib/api/api-client";

const DEFAULT_FOLDER = "uploads";
const DEFAULT_CONTENT_TYPE = "application/octet-stream";
const DEFAULT_MULTIPART_THRESHOLD = 25 * 1024 * 1024;

export interface R2PresignedUploadData {
  presignedUrl: string;
  publicUrl: string;
  key: string;
  filename: string;
  contentType: string;
}

export interface R2MultipartInitData {
  uploadId: string;
  key: string;
  publicUrl: string;
  partSize: number;
  partCount: number;
  filename: string;
}

export interface R2MultipartCompleteData {
  url: string;
  etag: string;
}

export interface R2UploadResult {
  key: string;
  filename: string;
  contentType: string;
  publicUrl: string;
  size: number;
  uploadType: "single" | "multipart";
  etag?: string | null;
  uploadId?: string;
}

export interface R2UploadOptions {
  folder?: string;
  key?: string;
  contentType?: string;
  multipartThreshold?: number;
  forceMultipart?: boolean;
  onProgress?: (progress: number) => void;
}

export interface R2BatchUploadOptions extends Omit<R2UploadOptions, "key"> {
  onFileComplete?: (result: R2UploadResult, index: number) => void;
}

interface NormalizedUploadFile {
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

interface PartUploadResult {
  ETag: string;
  PartNumber: number;
}

const normalizeFolder = (folder?: string) =>
  folder?.trim().replace(/^\/+|\/+$/g, "") || DEFAULT_FOLDER;

const getFileNameFromUri = (uri: string) => {
  const raw = uri.split("/").pop() || `upload_${Date.now()}`;
  return raw.split("?")[0] || `upload_${Date.now()}`;
};

const getExtension = (filename: string) => {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const inferMimeType = (filename: string) => {
  const extension = getExtension(filename);

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "aac":
      return "audio/aac";
    case "pdf":
      return "application/pdf";
    default:
      return DEFAULT_CONTENT_TYPE;
  }
};

const normalizeProgress = (loaded: number, total: number) => {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
};

const getBlobFromUri = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("Unable to read local file for upload");
  }

  return response.blob();
};

const normalizeUploadFile = async (
  file: UploadFileInput,
  contentType?: string,
): Promise<NormalizedUploadFile> => {
  const input =
    typeof file === "string"
      ? { uri: file }
      : {
          uri: file.uri,
          name: file.name,
          type: file.type,
        };

  const name = input.name || getFileNameFromUri(input.uri);
  const blob = await getBlobFromUri(input.uri);
  const type = contentType || input.type || blob.type || inferMimeType(name);

  return {
    name,
    type,
    size: blob.size,
    blob,
  };
};

const uploadBlobWithProgress = (
  url: string,
  blob: Blob,
  contentType: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ etag: string | null }> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded, event.total);
      }
    };

    xhr.onerror = () => {
      reject(new Error("R2 upload failed"));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          etag: xhr.getResponseHeader("ETag"),
        });
        return;
      }

      reject(new Error(`R2 upload failed with status ${xhr.status}`));
    };

    xhr.send(blob);
  });

export const R2UploadService = {
  async getPresignedUrl(params: {
    filename: string;
    contentType?: string;
    folder?: string;
    key?: string;
  }): Promise<R2PresignedUploadData> {
    const res = await apiClient.post<R2PresignedUploadData>("/r2/presigned-url", {
      filename: params.filename,
      contentType: params.contentType,
      folder: normalizeFolder(params.folder),
      ...(params.key ? { key: params.key } : {}),
    });

    return res.data;
  },

  async upload(file: UploadFileInput, options: R2UploadOptions = {}) {
    const normalized = await normalizeUploadFile(file, options.contentType);
    const multipartThreshold =
      options.multipartThreshold ?? DEFAULT_MULTIPART_THRESHOLD;

    if (options.forceMultipart || normalized.size > multipartThreshold) {
      return this.uploadMultipart(file, options, normalized);
    }

    return this.uploadSingle(file, options, normalized);
  },

  async uploadSingle(
    file: UploadFileInput,
    options: R2UploadOptions = {},
    existingFile?: NormalizedUploadFile,
  ): Promise<R2UploadResult> {
    const normalized =
      existingFile || (await normalizeUploadFile(file, options.contentType));

    const presigned = await this.getPresignedUrl({
      filename: normalized.name,
      contentType: normalized.type,
      folder: options.folder,
      key: options.key,
    });

    options.onProgress?.(0);

    const uploadResponse = await uploadBlobWithProgress(
      presigned.presignedUrl,
      normalized.blob,
      normalized.type,
      (loaded, total) => {
        options.onProgress?.(normalizeProgress(loaded, total));
      },
    );

    options.onProgress?.(100);

    return {
      key: presigned.key,
      filename: normalized.name,
      contentType: normalized.type,
      publicUrl: presigned.publicUrl,
      size: normalized.size,
      uploadType: "single",
      etag: uploadResponse.etag,
    };
  },

  async initiateMultipartUpload(params: {
    filename: string;
    contentType?: string;
    folder?: string;
    size: number;
  }): Promise<R2MultipartInitData> {
    const res = await apiClient.post<R2MultipartInitData>(
      "/r2/multipart/initiate",
      {
        filename: params.filename,
        contentType: params.contentType,
        folder: normalizeFolder(params.folder),
        size: params.size,
      },
    );

    return res.data;
  },

  async getMultipartPartUrls(params: {
    key: string;
    uploadId: string;
    partCount: number;
  }): Promise<Record<string, string>> {
    const res = await apiClient.post<{
      urls: Record<string, string>;
      totalParts: number;
    }>("/r2/multipart/part-urls", params);

    return res.data.urls;
  },

  async completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: PartUploadResult[];
  }): Promise<R2MultipartCompleteData> {
    const res = await apiClient.post<R2MultipartCompleteData>(
      "/r2/multipart/complete",
      params,
    );

    return res.data;
  },

  async uploadMultipart(
    file: UploadFileInput,
    options: R2UploadOptions = {},
    existingFile?: NormalizedUploadFile,
  ): Promise<R2UploadResult> {
    const normalized =
      existingFile || (await normalizeUploadFile(file, options.contentType));

    const initiated = await this.initiateMultipartUpload({
      filename: normalized.name,
      contentType: normalized.type,
      folder: options.folder,
      size: normalized.size,
    });

    const partUrls = await this.getMultipartPartUrls({
      key: initiated.key,
      uploadId: initiated.uploadId,
      partCount: initiated.partCount,
    });

    const uploadedParts: PartUploadResult[] = [];
    let uploadedBytes = 0;

    options.onProgress?.(0);

    for (let partNumber = 1; partNumber <= initiated.partCount; partNumber += 1) {
      const start = (partNumber - 1) * initiated.partSize;
      const end = Math.min(start + initiated.partSize, normalized.size);
      const partBlob = normalized.blob.slice(start, end);
      const baseUploadedBytes = uploadedBytes;

      const response = await uploadBlobWithProgress(
        partUrls[String(partNumber)],
        partBlob,
        normalized.type,
        (loaded, total) => {
          const currentBytes = baseUploadedBytes + Math.min(loaded, total);
          options.onProgress?.(
            normalizeProgress(currentBytes, normalized.size),
          );
        },
      );

      uploadedBytes = end;
      uploadedParts.push({
        ETag: response.etag || "",
        PartNumber: partNumber,
      });
    }

    const completed = await this.completeMultipartUpload({
      key: initiated.key,
      uploadId: initiated.uploadId,
      parts: uploadedParts,
    });

    options.onProgress?.(100);

    return {
      key: initiated.key,
      filename: normalized.name,
      contentType: normalized.type,
      publicUrl: completed.url,
      size: normalized.size,
      uploadType: "multipart",
      etag: completed.etag,
      uploadId: initiated.uploadId,
    };
  },

  async uploadMany(
    files: UploadFileInput[],
    options: R2BatchUploadOptions = {},
  ): Promise<R2UploadResult[]> {
    const results: R2UploadResult[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const result = await this.upload(files[index], options);
      results.push(result);
      options.onFileComplete?.(result, index);
    }

    return results;
  },

  async deleteFile(key: string) {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/r2/delete?key=${encodeURIComponent(key)}`);

    return res.data;
  },
};

export default R2UploadService;
