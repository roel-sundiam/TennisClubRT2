#!/usr/bin/env node

import dotenv from 'dotenv';
import { BackupUtils } from '../utils/backupUtils';
import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

dotenv.config();

interface RestoreArgs {
  file?: string;
  collections?: string[];
  force?: boolean;
  dryRun?: boolean;
  help?: boolean;
}

class DatabaseRestore {
  private mongoUri: string;
  private databaseName: string;
  private backupUtils: BackupUtils;
  private client: MongoClient;
  private db!: Db; // Using definite assignment assertion since it's set in connect()

  constructor() {
    this.mongoUri = process.env.MONGODB_URI || '';
    
    if (!this.mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    this.databaseName = this.extractDatabaseName(this.mongoUri);
    this.backupUtils = new BackupUtils(this.mongoUri, this.databaseName);
    this.client = new MongoClient(this.mongoUri);
  }

  private extractDatabaseName(uri: string): string {
    try {
      const url = new URL(uri);
      const pathname = url.pathname;
      if (pathname && pathname.length > 1) {
        return pathname.substring(1);
      }
      return 'tennisclub';
    } catch (error) {
      console.warn('⚠️ Could not extract database name from URI, using default');
      return 'tennisclub';
    }
  }

  private parseArgs(): RestoreArgs {
    const args = process.argv.slice(2);
    const parsedArgs: RestoreArgs = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--file':
        case '-f':
          if (i + 1 < args.length) {
            const nextArg = args[i + 1];
            if (nextArg) {
              parsedArgs.file = nextArg;
              i++;
            }
          }
          break;
        case '--collections':
        case '-c':
          if (i + 1 < args.length) {
            const nextArg = args[i + 1];
            if (nextArg) {
              parsedArgs.collections = nextArg.split(',').map(c => c.trim());
              i++;
            }
          }
          break;
        case '--force':
          parsedArgs.force = true;
          break;
        case '--dry-run':
          parsedArgs.dryRun = true;
          break;
        case '--help':
        case '-h':
          parsedArgs.help = true;
          break;
      }
    }

    return parsedArgs;
  }

  private showHelp(): void {
    console.log(`
🎾 Tennis Club RT2 - Database Restore Tool

Usage: npm run restore [options]

Options:
  -f, --file <path>          Backup file to restore from (required)
  -c, --collections <list>   Restore only specific collections (comma-separated)
  --force                    Skip confirmation prompts
  --dry-run                  Show what would be restored without making changes
  -h, --help                 Show this help message

Examples:
  npm run restore -- -f backup_2024-01-01T10-00-00.json
  npm run restore -- -f backup.json -c users,reservations
  npm run restore -- -f backup.json --dry-run
  npm run restore -- -f backup.json --force

Safety Features:
  - Backup validation before restore
  - Confirmation prompts (unless --force)
  - Dry-run mode to preview changes
  - Collection existence verification

Environment Variables:
  MONGODB_URI                 MongoDB connection string (required)
`);
  }

  private async askConfirmation(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  private async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
    console.log('📊 Connected to MongoDB for restore operations');
  }

  private async disconnect(): Promise<void> {
    await this.client.close();
    console.log('📤 Disconnected from MongoDB');
  }

  private async readBackupFile(filePath: string): Promise<any> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${filePath}`);
    }

    console.log(`📖 Reading backup file: ${filePath}`);
    
    // Validate backup file first
    if (!(await this.backupUtils.validateBackupFile(filePath))) {
      throw new Error('Backup file validation failed');
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  private async getExistingCollections(): Promise<string[]> {
    const collections = await this.db.listCollections().toArray();
    return collections.map(col => col.name);
  }

  private async dropCollection(collectionName: string): Promise<void> {
    try {
      await this.db.collection(collectionName).drop();
      console.log(`  🗑️ Dropped existing collection: ${collectionName}`);
    } catch (error) {
      // Collection might not exist, which is fine
      console.log(`  ℹ️ Collection ${collectionName} did not exist`);
    }
  }

  private async restoreCollection(
    collectionName: string, 
    documents: any[], 
    indexes: any[] = [],
    dryRun: boolean = false
  ): Promise<void> {
    console.log(`📦 Restoring collection: ${collectionName} (${documents.length} documents)`);
    
    if (dryRun) {
      console.log(`  🔍 [DRY RUN] Would restore ${documents.length} documents`);
      if (indexes && indexes.length > 0) {
        console.log(`  🔍 [DRY RUN] Would create ${indexes.length} indexes`);
      }
      return;
    }

    const collection = this.db.collection(collectionName);

    // Insert documents in batches to avoid memory issues
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      if (batch.length > 0) {
        try {
          await collection.insertMany(batch, { ordered: false });
          insertedCount += batch.length;
          console.log(`  ✅ Inserted batch: ${insertedCount}/${documents.length} documents`);
        } catch (error: any) {
          // Handle duplicate key errors gracefully
          if (error.code === 11000) {
            console.warn(`  ⚠️ Some documents already exist (duplicate key error)`);
            insertedCount += batch.length;
          } else {
            throw error;
          }
        }
      }
    }

    // Restore indexes (skip _id index as it's created automatically)
    if (indexes && indexes.length > 0) {
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');
      
      for (const index of customIndexes) {
        try {
          await collection.createIndex(index.key, {
            name: index.name,
            ...index
          });
          console.log(`  🔧 Created index: ${index.name}`);
        } catch (error) {
          console.warn(`  ⚠️ Could not create index ${index.name}:`, error);
        }
      }
    }

    console.log(`  ✅ Collection ${collectionName} restored successfully`);
  }

  async performRestore(
    backupFile: string, 
    options: { collections?: string[]; force?: boolean; dryRun?: boolean } = {}
  ): Promise<void> {
    console.log('🎾 Starting database restore...\n');
    
    const startTime = Date.now();
    
    try {
      // Read and validate backup file
      const backupData = await this.readBackupFile(backupFile);
      const { metadata, data, indexes } = backupData;
      
      console.log('📋 Backup Information:');
      console.log(`  Database: ${metadata.databaseName}`);
      console.log(`  Created: ${new Date(metadata.timestamp).toLocaleString()}`);
      console.log(`  Type: ${metadata.backupType}`);
      console.log(`  Collections: ${metadata.collections.length}`);
      console.log(`  Total Documents: ${metadata.totalDocuments}\n`);

      // Determine which collections to restore
      let collectionsToRestore = metadata.collections;
      
      if (options.collections && options.collections.length > 0) {
        const validCollections = options.collections.filter(name => 
          metadata.collections.includes(name)
        );
        const invalidCollections = options.collections.filter(name => 
          !metadata.collections.includes(name)
        );
        
        if (invalidCollections.length > 0) {
          console.warn(`⚠️ Collections not found in backup: ${invalidCollections.join(', ')}`);
        }
        
        if (validCollections.length === 0) {
          throw new Error('No valid collections found to restore');
        }
        
        collectionsToRestore = validCollections;
      }

      console.log(`📋 Collections to restore: ${collectionsToRestore.join(', ')}\n`);

      // Safety confirmation
      if (!options.force && !options.dryRun) {
        const currentDatabase = this.databaseName;
        const warning = `⚠️ WARNING: This will replace existing data in database '${currentDatabase}'`;
        console.log(warning);
        
        const confirmed = await this.askConfirmation('Are you sure you want to continue?');
        if (!confirmed) {
          console.log('❌ Restore cancelled by user');
          return;
        }
      }

      // Connect to database
      await this.connect();

      // Get existing collections for reference
      const existingCollections = await this.getExistingCollections();
      
      // Restore each collection
      for (const collectionName of collectionsToRestore) {
        const documents = data[collectionName] || [];
        const collectionIndexes = indexes?.[collectionName] || [];
        
        // Drop existing collection if it exists and not in dry-run mode
        if (existingCollections.includes(collectionName) && !options.dryRun) {
          await this.dropCollection(collectionName);
        }
        
        // Restore collection
        await this.restoreCollection(
          collectionName, 
          documents, 
          collectionIndexes,
          options.dryRun || false
        );
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (options.dryRun) {
        console.log(`\n🔍 Dry run completed in ${duration}s - no changes made`);
      } else {
        console.log(`\n✅ Database restore completed successfully in ${duration}s`);
        console.log(`📊 Restored ${collectionsToRestore.length} collections`);
      }
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async listAvailableBackups(): Promise<void> {
    console.log('📋 Available backup files:\n');
    
    const backups = await this.backupUtils.listBackups();
    
    if (backups.length === 0) {
      console.log('  No backup files found');
      console.log(`  Backup directory: ${this.backupUtils.getBackupDirectory()}\n`);
      return;
    }
    
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.filename}`);
      console.log(`     Size: ${backup.size}`);
      console.log(`     Created: ${backup.created.toLocaleString()}\n`);
    });
  }

  async run(): Promise<void> {
    const args = this.parseArgs();
    
    if (args.help) {
      this.showHelp();
      return;
    }

    try {
      // Show available backups first
      await this.listAvailableBackups();
      
      if (!args.file) {
        console.error('❌ Backup file is required. Use --file option or see --help');
        process.exit(1);
      }

      // Convert relative path to absolute if needed
      const backupFile = path.isAbsolute(args.file) 
        ? args.file 
        : path.join(this.backupUtils.getBackupDirectory(), args.file);

      await this.performRestore(backupFile, {
        collections: args.collections,
        force: args.force,
        dryRun: args.dryRun
      });
      
    } catch (error) {
      console.error('\n❌ Restore operation failed:', error);
      process.exit(1);
    }
  }
}

// Run the restore if this script is executed directly
if (require.main === module) {
  const restore = new DatabaseRestore();
  restore.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DatabaseRestore };