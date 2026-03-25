import {
  R2UploadService,
  type R2BatchUploadOptions,
  type R2UploadOptions,
  type R2UploadResult,
} from "@/lib/services/r2-upload-service";
import { type UploadFileInput } from "@/lib/api/api-client";
import { useCallback, useState } from "react";

const getObjectErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return null;

  const errorWithMessage = error as {
    message?: unknown;
    data?: { message?: unknown };
  };

  if (
    typeof errorWithMessage.message === "string" &&
    errorWithMessage.message.trim()
  ) {
    return errorWithMessage.message;
  }

  if (
    typeof errorWithMessage.data?.message === "string" &&
    errorWithMessage.data.message.trim()
  ) {
    return errorWithMessage.data.message;
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const objectMessage = getObjectErrorMessage(error);
  if (objectMessage) {
    return objectMessage;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Upload failed";
};

export function useR2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<R2UploadResult | null>(null);
  const [results, setResults] = useState<R2UploadResult[]>([]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setResults([]);
  }, []);

  const upload = useCallback(
    async (file: UploadFileInput, options: R2UploadOptions = {}) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        const uploaded = await R2UploadService.upload(file, {
          ...options,
          onProgress: (nextProgress) => {
            setProgress(nextProgress);
            options.onProgress?.(nextProgress);
          },
        });

        setResult(uploaded);
        return uploaded;
      } catch (uploadError: unknown) {
        console.error("R2 upload failed:", uploadError);
        setError(getErrorMessage(uploadError));
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const uploadMany = useCallback(
    async (files: UploadFileInput[], options: R2BatchUploadOptions = {}) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      setResult(null);
      setResults([]);

      try {
        const totalFiles = files.length || 1;
        let completedFiles = 0;

        const uploadedResults = await R2UploadService.uploadMany(files, {
          ...options,
          onProgress: (fileProgress) => {
            const aggregateProgress = Math.round(
              ((completedFiles + fileProgress / 100) / totalFiles) * 100,
            );

            setProgress(aggregateProgress);
            options.onProgress?.(aggregateProgress);
          },
          onFileComplete: (uploaded, index) => {
            completedFiles = index + 1;
            setResults((current) => [...current, uploaded]);
            const completedProgress = Math.round(
              ((index + 1) / totalFiles) * 100,
            );
            setProgress(completedProgress);
            options.onProgress?.(completedProgress);
            options.onFileComplete?.(uploaded, index);
          },
        });

        setResults(uploadedResults);
        setProgress(100);
        return uploadedResults;
      } catch (uploadError: unknown) {
        console.error("R2 batch upload failed:", uploadError);
        setError(getErrorMessage(uploadError));
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const deleteFile = useCallback(async (key: string) => {
    return R2UploadService.deleteFile(key);
  }, []);

  return {
    upload,
    uploadMany,
    deleteFile,
    reset,
    isUploading,
    progress,
    error,
    result,
    results,
  };
}

export default useR2Upload;
