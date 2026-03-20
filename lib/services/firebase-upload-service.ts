import { apiClient, type UploadFileInput } from "@/lib/api/api-client";

export interface FirebaseUploadResult {
  bucket: string;
  path: string;
  url: string;
  token: string;
  name: string;
  content_type?: string | null;
  size?: number | null;
}

export interface FirebaseUploadOptions {
  folder?: string;
}

const normalizeFolder = (folder?: string) =>
  folder?.trim().replace(/^\/+|\/+$/g, "");

export const FirebaseUploadService = {
  async upload(
    file: UploadFileInput,
    options: FirebaseUploadOptions = {},
  ): Promise<FirebaseUploadResult> {
    const res = await apiClient.uploadFile<FirebaseUploadResult>(
      "/uploads/firebase",
      file,
      "file",
      {
        ...(normalizeFolder(options.folder)
          ? { folder: normalizeFolder(options.folder) }
          : {}),
      },
    );

    console.log("Upload file:", res);

    return res.data;
  },

  async uploadCommunityAvatar(
    file: UploadFileInput,
  ): Promise<FirebaseUploadResult> {
    return this.upload(file, { folder: "community-groups/avatars" });
  },

  async uploadProfileAsset(
    file: UploadFileInput,
  ): Promise<FirebaseUploadResult> {
    return this.upload(file, { folder: "profiles" });
  },
};

export default FirebaseUploadService;
