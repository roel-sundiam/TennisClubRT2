import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

export interface BackupMetadata {
  timestamp: string;
  databaseName: string;
  collections: string[];
  totalDocuments: number;
  backupType: 'full' | 'collections';
  version: string;
}

export interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  collections?: string[];
  includeIndexes?: boolean;
}

export class BackupUtils {
  private client: MongoClient;
  private db!: Db; // Using definite assignment assertion since it's set in connect()
  private outputDir: string;

  constructor(mongoUri: string, databaseName: string, outputDir?: string) {
    this.client = new MongoClient(mongoUri);
    this.outputDir = outputDir || path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
    console.log('📊 Connected to MongoDB for backup operations');
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('📤 Disconnected from MongoDB');
  }

  generateBackupFileName(prefix: string = 'backup', compress: boolean = false): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = compress ? '.json.gz' : '.json';
    return `${prefix}_${timestamp}${extension}`;
  }

  async getCollections(): Promise<string[]> {
    const collections = await this.db.listCollections().toArray();
    return collections.map(col => col.name);
  }

  async getCollectionStats(collectionName: string): Promise<{ count: number; size: number }> {
    try {
      const collection = this.db.collection(collectionName);
      const count = await collection.countDocuments();
      const stats = await this.db.command({ collStats: collectionName });
      return { count, size: stats.size || 0 };
    } catch (error) {
      console.warn(`⚠️ Could not get stats for collection ${collectionName}:`, error);
      return { count: 0, size: 0 };
    }
  }

  async exportCollection(collectionName: string): Promise<any[]> {
    const collection = this.db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    console.log(`📋 Exported ${documents.length} documents from ${collectionName}`);
    return documents;
  }

  async getIndexes(collectionName: string): Promise<any[]> {
    try {
      const collection = this.db.collection(collectionName);
      const indexes = await collection.indexes();
      return indexes;
    } catch (error) {
      console.warn(`⚠️ Could not get indexes for collection ${collectionName}:`, error);
      return [];
    }
  }

  async createBackupFile(
    data: any, 
    filename: string, 
    compress: boolean = false
  ): Promise<string> {
    const filePath = path.join(this.outputDir, filename);
    const jsonData = JSON.stringify(data, null, 2);

    if (compress) {
      const writeStream = fs.createWriteStream(filePath);
      const gzipStream = createGzip({ level: 6 });
      
      await pipelineAsync(
        Buffer.from(jsonData),
        gzipStream,
        writeStream
      );
    } else {
      fs.writeFileSync(filePath, jsonData, 'utf8');
    }

    const stats = fs.statSync(filePath);
    console.log(`💾 Backup saved: ${filePath} (${this.formatBytes(stats.size)})`);
    
    return filePath;
  }

  async validateBackupFile(filePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Backup file not found: ${filePath}`);
        return false;
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error(`❌ Backup file is empty: ${filePath}`);
        return false;
      }

      // Try to parse JSON structure
      const content = this.readBackupFile(filePath);
      if (!content.metadata || !content.data) {
        console.error(`❌ Invalid backup file structure: ${filePath}`);
        return false;
      }

      console.log(`✅ Backup file validation passed: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Backup file validation failed: ${filePath}`, error);
      return false;
    }
  }

  readBackupFile(filePath: string): any {
    const isCompressed = filePath.endsWith('.gz');
    
    if (isCompressed) {
      // For compressed files, we'd need to decompress first
      // This is a simplified version - in production you'd want proper stream handling
      throw new Error('Reading compressed files not implemented in this simplified version');
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  }

  async cleanupOldBackups(retentionDays: number = 7): Promise<void> {
    const files = fs.readdirSync(this.outputDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith('backup_') && (file.endsWith('.json') || file.endsWith('.json.gz'))) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleanup completed: ${deletedCount} old backup(s) deleted`);
    } else {
      console.log(`✨ No old backups to clean up`);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async createMetadata(
    collections: string[], 
    backupType: 'full' | 'collections'
  ): Promise<BackupMetadata> {
    let totalDocuments = 0;
    
    for (const collectionName of collections) {
      const stats = await this.getCollectionStats(collectionName);
      totalDocuments += stats.count;
    }

    return {
      timestamp: new Date().toISOString(),
      databaseName: this.db.databaseName,
      collections,
      totalDocuments,
      backupType,
      version: '1.0.0'
    };
  }

  getBackupDirectory(): string {
    return this.outputDir;
  }

  async listBackups(): Promise<Array<{ filename: string; size: string; created: Date }>> {
    const files = fs.readdirSync(this.outputDir);
    const backups = [];

    for (const file of files) {
      if (file.startsWith('backup_') && (file.endsWith('.json') || file.endsWith('.json.gz'))) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        backups.push({
          filename: file,
          size: this.formatBytes(stats.size),
          created: stats.mtime
        });
      }
    }

    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  }
}