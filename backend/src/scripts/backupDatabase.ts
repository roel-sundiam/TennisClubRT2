#!/usr/bin/env node

import dotenv from 'dotenv';
import { BackupUtils, BackupOptions } from '../utils/backupUtils';
import { MongoClient } from 'mongodb';

dotenv.config();

interface BackupArgs {
  collections?: string[];
  compress?: boolean;
  outputDir?: string;
  help?: boolean;
}

class DatabaseBackup {
  private mongoUri: string;
  private databaseName: string;
  private backupUtils: BackupUtils;

  constructor() {
    this.mongoUri = process.env.MONGODB_URI || '';
    
    if (!this.mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    // Extract database name from MongoDB URI
    this.databaseName = this.extractDatabaseName(this.mongoUri);
    this.backupUtils = new BackupUtils(this.mongoUri, this.databaseName);
  }

  private extractDatabaseName(uri: string): string {
    try {
      // Extract database name from MongoDB Atlas URI
      const url = new URL(uri);
      const pathname = url.pathname;
      if (pathname && pathname.length > 1) {
        return pathname.substring(1); // Remove leading slash
      }
      
      // Default database name if not specified in URI
      return 'tennisclub';
    } catch (error) {
      console.warn('⚠️ Could not extract database name from URI, using default');
      return 'tennisclub';
    }
  }

  private parseArgs(): BackupArgs {
    const args = process.argv.slice(2);
    const parsedArgs: BackupArgs = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
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
        case '--compress':
        case '-z':
          parsedArgs.compress = true;
          break;
        case '--output':
        case '-o':
          if (i + 1 < args.length) {
            const nextArg = args[i + 1];
            if (nextArg) {
              parsedArgs.outputDir = nextArg;
              i++;
            }
          }
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
🎾 Tennis Club RT2 - Database Backup Tool

Usage: npm run backup [options]

Options:
  -c, --collections <list>    Backup specific collections (comma-separated)
  -z, --compress             Compress backup files with gzip
  -o, --output <dir>         Specify output directory for backups
  -h, --help                 Show this help message

Examples:
  npm run backup                              # Full database backup
  npm run backup -- --compress               # Compressed full backup
  npm run backup -- -c users,reservations    # Backup specific collections
  npm run backup -- -o /path/to/backups      # Custom output directory

Environment Variables:
  MONGODB_URI                 MongoDB connection string (required)
`);
  }

  async performFullBackup(options: BackupOptions = {}): Promise<string> {
    console.log('🎾 Starting full database backup...\n');
    
    const startTime = Date.now();
    
    try {
      await this.backupUtils.connect();
      
      // Get all collections
      const allCollections = await this.backupUtils.getCollections();
      console.log(`📊 Found ${allCollections.length} collections in database: ${this.databaseName}`);
      
      // Filter out system collections
      const userCollections = allCollections.filter(name => 
        !name.startsWith('system.') && !name.includes('__')
      );
      
      console.log(`📋 Backing up ${userCollections.length} collections: ${userCollections.join(', ')}\n`);
      
      const backupData: any = {
        metadata: await this.backupUtils.createMetadata(userCollections, 'full'),
        data: {},
        indexes: {}
      };

      // Export each collection
      for (const collectionName of userCollections) {
        console.log(`📦 Exporting collection: ${collectionName}`);
        
        const documents = await this.backupUtils.exportCollection(collectionName);
        const stats = await this.backupUtils.getCollectionStats(collectionName);
        
        backupData.data[collectionName] = documents;
        
        if (options.includeIndexes !== false) {
          const indexes = await this.backupUtils.getIndexes(collectionName);
          backupData.indexes[collectionName] = indexes;
        }
        
        console.log(`  ✅ ${documents.length} documents (${this.backupUtils.formatBytes(stats.size)})`);
      }

      // Create backup file
      const filename = this.backupUtils.generateBackupFileName('full-backup', options.compress || false);
      const backupPath = await this.backupUtils.createBackupFile(
        backupData,
        filename,
        options.compress || false
      );

      // Validate backup
      if (await this.backupUtils.validateBackupFile(backupPath)) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Full backup completed successfully in ${duration}s`);
        console.log(`📁 Backup saved to: ${backupPath}`);
        
        return backupPath;
      } else {
        throw new Error('Backup validation failed');
      }
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    } finally {
      await this.backupUtils.disconnect();
    }
  }

  async performCollectionBackup(collections: string[], options: BackupOptions = {}): Promise<string> {
    console.log(`🎾 Starting backup for collections: ${collections.join(', ')}\n`);
    
    const startTime = Date.now();
    
    try {
      await this.backupUtils.connect();
      
      // Verify collections exist
      const allCollections = await this.backupUtils.getCollections();
      const validCollections = collections.filter(name => allCollections.includes(name));
      const invalidCollections = collections.filter(name => !allCollections.includes(name));
      
      if (invalidCollections.length > 0) {
        console.warn(`⚠️ Collections not found: ${invalidCollections.join(', ')}`);
      }
      
      if (validCollections.length === 0) {
        throw new Error('No valid collections found to backup');
      }
      
      console.log(`📋 Backing up ${validCollections.length} collections\n`);
      
      const backupData: any = {
        metadata: await this.backupUtils.createMetadata(validCollections, 'collections'),
        data: {},
        indexes: {}
      };

      // Export specified collections
      for (const collectionName of validCollections) {
        console.log(`📦 Exporting collection: ${collectionName}`);
        
        const documents = await this.backupUtils.exportCollection(collectionName);
        const stats = await this.backupUtils.getCollectionStats(collectionName);
        
        backupData.data[collectionName] = documents;
        
        if (options.includeIndexes !== false) {
          const indexes = await this.backupUtils.getIndexes(collectionName);
          backupData.indexes[collectionName] = indexes;
        }
        
        console.log(`  ✅ ${documents.length} documents (${this.backupUtils.formatBytes(stats.size)})`);
      }

      // Create backup file
      const filename = this.backupUtils.generateBackupFileName(
        `collections-${validCollections.join('-')}`,
        options.compress || false
      );
      const backupPath = await this.backupUtils.createBackupFile(
        backupData,
        filename,
        options.compress || false
      );

      // Validate backup
      if (await this.backupUtils.validateBackupFile(backupPath)) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Collection backup completed successfully in ${duration}s`);
        console.log(`📁 Backup saved to: ${backupPath}`);
        
        return backupPath;
      } else {
        throw new Error('Backup validation failed');
      }
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    } finally {
      await this.backupUtils.disconnect();
    }
  }

  async listExistingBackups(): Promise<void> {
    console.log('📋 Existing backups:\n');
    
    const backups = await this.backupUtils.listBackups();
    
    if (backups.length === 0) {
      console.log('  No backups found');
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
      // Show existing backups first
      await this.listExistingBackups();
      
      // Set up backup options
      const options: BackupOptions = {
        compress: args.compress,
        outputDir: args.outputDir,
        includeIndexes: true
      };

      if (args.collections && args.collections.length > 0) {
        await this.performCollectionBackup(args.collections, options);
      } else {
        await this.performFullBackup(options);
      }

      // Clean up old backups (keep last 7 days)
      console.log('\n🧹 Cleaning up old backups...');
      await this.backupUtils.cleanupOldBackups(7);
      
    } catch (error) {
      console.error('\n❌ Backup operation failed:', error);
      process.exit(1);
    }
  }
}

// Run the backup if this script is executed directly
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DatabaseBackup };