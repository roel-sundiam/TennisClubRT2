import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION DATABASE (READ-ONLY - NO CHANGES WILL BE MADE)
const PRODUCTION_URI = 'mongodb+srv://admin:Helenbot04117777!1@mydb.zxr9i5k.mongodb.net/TennisClubRT2?retryWrites=true&w=majority&appName=MyDB';

// TEST DATABASE (WILL BE WRITTEN TO)
const TEST_URI = 'mongodb+srv://admin:Helenbot04117777!1@mydb.zxr9i5k.mongodb.net/TennisClubRT2_Test?retryWrites=true&w=majority&appName=MyDB';

async function replicateDatabase() {
  console.log('🔄 Starting database replication...\n');

  // Connect to production database (READ-ONLY)
  console.log('📖 Connecting to PRODUCTION database (READ-ONLY)...');
  const prodConnection = await mongoose.createConnection(PRODUCTION_URI).asPromise();
  console.log('✅ Connected to production database');

  // Connect to test database
  console.log('📝 Connecting to TEST database...');
  const testConnection = await mongoose.createConnection(TEST_URI).asPromise();
  console.log('✅ Connected to test database\n');

  try {
    // Get all collections from production
    const collections = await prodConnection.db!.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in production database\n`);

    let totalDocuments = 0;

    // Copy each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📋 Processing collection: ${collectionName}`);

      // Read from production (READ-ONLY)
      const prodCollection = prodConnection.db!.collection(collectionName);
      const documents = await prodCollection.find({}).toArray();

      console.log(`   📥 Read ${documents.length} documents from production`);

      if (documents.length > 0) {
        // Write to test database
        const testCollection = testConnection.db!.collection(collectionName);

        // Clear existing data in test database first
        await testCollection.deleteMany({});
        console.log(`   🗑️  Cleared existing data in test database`);

        // Insert all documents
        await testCollection.insertMany(documents);
        console.log(`   ✅ Copied ${documents.length} documents to test database\n`);

        totalDocuments += documents.length;
      } else {
        console.log(`   ⚠️  Collection is empty, skipping\n`);
      }
    }

    // Copy indexes
    console.log('📇 Copying indexes...');
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      const prodCollection = prodConnection.db!.collection(collectionName);
      const testCollection = testConnection.db!.collection(collectionName);

      const indexes = await prodCollection.indexes();

      // Skip the default _id index
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');

      if (customIndexes.length > 0) {
        console.log(`   Creating ${customIndexes.length} indexes for ${collectionName}`);
        for (const index of customIndexes) {
          try {
            const { key, ...options } = index;
            delete options.v;
            delete options.ns;
            await testCollection.createIndex(key, options);
          } catch (error: any) {
            console.log(`   ⚠️  Index already exists: ${index.name}`);
          }
        }
      }
    }

    console.log('\n✅ REPLICATION COMPLETE!');
    console.log(`📊 Summary:`);
    console.log(`   - Collections replicated: ${collections.length}`);
    console.log(`   - Total documents copied: ${totalDocuments}`);
    console.log(`\n⚠️  IMPORTANT: Production database was NOT modified (read-only operation)`);
    console.log(`✅ Test database (TennisClubRT2_Test) now has a complete copy of production data`);

  } catch (error) {
    console.error('❌ Error during replication:', error);
  } finally {
    await prodConnection.close();
    await testConnection.close();
    console.log('\n📤 Disconnected from both databases');
  }
}

replicateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
