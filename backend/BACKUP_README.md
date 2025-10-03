# Tennis Club RT2 - Database Backup System

This document explains how to use the MongoDB backup and restore system for the Tennis Club RT2 application.

## Overview

The backup system provides comprehensive tools to:
- Create full database backups
- Backup specific collections
- Restore from backup files
- Validate backup integrity
- Automatic cleanup of old backups

## Quick Start

### Create a Full Backup

```bash
cd backend
npm run backup
```

### Create a Compressed Backup

```bash
npm run backup:compress
```

### Backup Specific Collections

```bash
npm run backup:collections users,reservations,payments
```

### Restore from Backup

```bash
# List available backups first
npm run restore

# Restore from a specific backup file
npm run restore -- --file backup_2024-01-01T10-00-00.json

# Dry run to see what would be restored
npm run restore:dry-run -- --file backup_2024-01-01T10-00-00.json
```

## Available Commands

### Backup Commands

| Command | Description |
|---------|-------------|
| `npm run backup` | Create a full database backup |
| `npm run backup:compress` | Create a compressed full backup |
| `npm run backup:collections` | Backup specific collections (requires --collections argument) |

### Restore Commands

| Command | Description |
|---------|-------------|
| `npm run restore` | Restore from backup (requires --file argument) |
| `npm run restore:dry-run` | Preview restore without making changes |

## Command Options

### Backup Options

```bash
# Full backup with compression
npm run backup -- --compress

# Backup specific collections
npm run backup -- --collections users,reservations,payments

# Custom output directory
npm run backup -- --output /path/to/backups

# Show help
npm run backup -- --help
```

### Restore Options

```bash
# Restore specific file
npm run restore -- --file backup_2024-01-01T10-00-00.json

# Restore only specific collections
npm run restore -- --file backup.json --collections users,payments

# Skip confirmation prompts
npm run restore -- --file backup.json --force

# Dry run (preview only)
npm run restore -- --file backup.json --dry-run

# Show help
npm run restore -- --help
```

## Backup File Structure

Backup files are saved as JSON with the following structure:

```json
{
  "metadata": {
    "timestamp": "2024-01-01T10:00:00.000Z",
    "databaseName": "tennisclub",
    "collections": ["users", "reservations", "payments"],
    "totalDocuments": 1500,
    "backupType": "full",
    "version": "1.0.0"
  },
  "data": {
    "users": [...],
    "reservations": [...],
    "payments": [...]
  },
  "indexes": {
    "users": [...],
    "reservations": [...],
    "payments": [...]
  }
}
```

## File Locations

- **Backup Directory**: `backend/backups/`
- **Backup Scripts**: `backend/src/scripts/`
- **Utilities**: `backend/src/utils/backupUtils.ts`

## Safety Features

### Backup Safety
- Automatic backup validation after creation
- Progress logging during backup operations
- Error handling with detailed messages
- Automatic cleanup of old backups (7-day retention)

### Restore Safety
- Backup file validation before restore
- Confirmation prompts (unless `--force` is used)
- Dry-run mode to preview changes
- Collection existence verification
- Batch processing to avoid memory issues

## Automated Cleanup

The system automatically cleans up backup files older than 7 days. You can customize this by modifying the retention period in the backup script.

## Examples

### Daily Backup Routine

```bash
# Create a compressed backup with timestamp
npm run backup:compress

# List existing backups
npm run restore
```

### Collection-Specific Backup

```bash
# Backup only user and reservation data
npm run backup -- --collections users,reservations

# Restore only users from a backup
npm run restore -- --file backup.json --collections users
```

### Safe Restore Process

```bash
# 1. First do a dry run to see what will be restored
npm run restore:dry-run -- --file backup_2024-01-01T10-00-00.json

# 2. If everything looks good, perform the actual restore
npm run restore -- --file backup_2024-01-01T10-00-00.json
```

## Environment Variables

The backup system uses the same MongoDB connection as the main application:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tennisclub
```

## Troubleshooting

### Common Issues

1. **"MONGODB_URI not set"**
   - Ensure your `.env` file contains the MongoDB connection string
   - Make sure you're running commands from the `backend` directory

2. **"Backup file not found"**
   - Check the file path is correct
   - List available backups with `npm run restore`

3. **"Collection validation failed"**
   - The backup file may be corrupted
   - Try creating a new backup

4. **Memory issues with large databases**
   - The system processes documents in batches
   - For very large databases, consider backing up collections individually

### Getting Help

```bash
# Show backup help
npm run backup -- --help

# Show restore help
npm run restore -- --help
```

## Best Practices

1. **Regular Backups**: Set up automated backups using cron jobs
2. **Test Restores**: Periodically test restore procedures with non-production data
3. **Multiple Locations**: Store backups in multiple locations for redundancy
4. **Compression**: Use compression for production backups to save space
5. **Documentation**: Keep track of what each backup contains

## Security Considerations

- Backup files contain sensitive data - store them securely
- Limit access to backup files using proper file permissions
- Consider encrypting backup files for additional security
- Never commit backup files to version control

## Integration with Production

For production environments, consider:

1. Setting up automated daily backups
2. Storing backups in cloud storage (S3, Google Cloud, etc.)
3. Setting up monitoring and alerts for backup failures
4. Testing disaster recovery procedures regularly

## Support

For issues or questions about the backup system, refer to the main project documentation or contact the development team.