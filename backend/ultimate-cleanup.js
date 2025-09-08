const mongoose = require('mongoose');
require('dotenv').config();

async function ultimateCleanup() {
  try {
    // Force fresh connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-club-rt2');
    console.log('✅ Fresh connection to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find user
    const user = await db.collection('users').findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ User RoelSundiam not found');
      return;
    }
    
    console.log('🧹 ULTIMATE CLEANUP for', user.fullName);
    console.log('User ID:', user._id);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // BRUTAL cleanup approach - delete from ALL collections that might contain user data
    const collectionsToClean = ['reservations', 'payments', 'tempreservations'];
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        
        // Try multiple user ID variations
        const queries = [
          { userId: user._id },
          { userId: user._id.toString() },
          { userId: { $in: [user._id, user._id.toString()] } },
          // Also try without ObjectId wrapper in case it's stored differently
          { userId: user._id.toHexString() }
        ];
        
        for (const query of queries) {
          const count = await collection.countDocuments(query);
          if (count > 0) {
            console.log(`🔍 Found ${count} documents in ${collectionName} with query:`, JSON.stringify(query));
            const result = await collection.deleteMany(query);
            console.log(`🗑️  Deleted ${result.deletedCount} documents from ${collectionName}`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found or error:`, error.message);
      }
    }
    
    // Force a direct query to double-check
    console.log('\n🔍 FINAL VERIFICATION:');
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const allUserDocs = await collection.find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
            { userId: user._id.toHexString() }
          ]
        }).toArray();
        
        console.log(`   ${collectionName}: ${allUserDocs.length} remaining documents`);
        if (allUserDocs.length > 0) {
          console.log('   🚨 STILL FOUND DOCUMENTS:', allUserDocs.map(d => ({ 
            _id: d._id, 
            userId: d.userId,
            userIdType: typeof d.userId,
            description: d.description || d.date || 'no description'
          })));
        }
      } catch (error) {
        console.log(`   ${collectionName}: Error checking - ${error.message}`);
      }
    }
    
    // Also try to clear any cached data by restarting mongoose connection
    console.log('\n🔄 Forcing connection refresh...');
    await mongoose.disconnect();
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-club-rt2');
    
    console.log('\n🎉 ULTIMATE CLEANUP COMPLETED!');
    console.log('✅ Database should now be completely clean');
    console.log('✅ Try making a fresh booking now');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

ultimateCleanup();