import { Injectable, Logger } from '@nestjs/common';
import { Client, Databases, Storage, Users } from 'node-appwrite';

export interface AppwriteRuntimeStatus {
  configured: boolean;
  endpoint: string;
  projectId: string;
  databaseId: string;
  bucketId: string;
  databaseReachable: boolean;
  storageReachable: boolean;
}

@Injectable()
export class AppwriteService {
  private readonly logger = new Logger(AppwriteService.name);
  private readonly endpoint = process.env.APPWRITE_ENDPOINT ?? 'https://nyc.cloud.appwrite.io/v1';
  private readonly projectId = process.env.APPWRITE_PROJECT_ID ?? '6a80ed6d002ccb5cec52';
  private readonly databaseId = process.env.APPWRITE_DATABASE_ID ?? 'uniflow';
  private readonly bucketId = process.env.APPWRITE_STORAGE_BUCKET_ID ?? 'avatars';
  private readonly apiKey = process.env.APPWRITE_API_KEY ?? process.env.APPWRITE ?? '';
  private readonly client: Client | null;
  readonly databases: Databases | null;
  readonly storage: Storage | null;
  readonly users: Users | null;

  constructor() {
    if (!this.apiKey) {
      this.client = null;
      this.databases = null;
      this.storage = null;
      this.users = null;
      return;
    }

    this.client = new Client().setEndpoint(this.endpoint).setProject(this.projectId).setKey(this.apiKey);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.users = new Users(this.client);
  }

  async status(): Promise<AppwriteRuntimeStatus> {
    if (!this.client || !this.databases || !this.storage) {
      return {
        configured: false,
        endpoint: this.endpoint,
        projectId: this.projectId,
        databaseId: this.databaseId,
        bucketId: this.bucketId,
        databaseReachable: false,
        storageReachable: false,
      };
    }

    const [databaseReachable, storageReachable] = await Promise.all([
      this.databases.get(this.databaseId).then(() => true).catch((error: unknown) => {
        this.logger.warn(`Appwrite database check failed: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }),
      this.storage.getBucket(this.bucketId).then(() => true).catch((error: unknown) => {
        this.logger.warn(`Appwrite storage check failed: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }),
    ]);

    return {
      configured: true,
      endpoint: this.endpoint,
      projectId: this.projectId,
      databaseId: this.databaseId,
      bucketId: this.bucketId,
      databaseReachable,
      storageReachable,
    };
  }
}
