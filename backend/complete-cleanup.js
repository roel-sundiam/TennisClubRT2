const mongoose = require('mongoose');
require('dotenv').config();

async function completeCleanup() {
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
    
    console.log('🧹 COMPLETE CLEANUP for', user.fullName);
    console.log('User ID:', user._id);
    
    // Delete ALL data for this user from ALL collections
    const collectionsToClean = [
      'reservations', 
      'payments', 
      'tempreservations',
      'cointransactions',
      'useractivities'
    ];
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        
        // First count all records for this user
        const totalCount = await collection.countDocuments({
          userId: { $in: [user._id, user._id.toString(), user._id.toHexString()] }
        });
        
        if (totalCount > 0) {
          console.log(`🔍 Found ${totalCount} documents in ${collectionName}`);
          
          // Delete using comprehensive query
          const result = await collection.deleteMany({
            userId: { $in: [user._id, user._id.toString(), user._id.toHexString()] }
          });
          
          console.log(`🗑️  Deleted ${result.deletedCount} documents from ${collectionName}`);
        } else {
          console.log(`✅ No documents found in ${collectionName}`);
        }
        
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} error:`, error.message);
      }
    }
    
    // Double-check by listing all remaining documents
    console.log('\n🔍 FINAL VERIFICATION:');
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const remainingCount = await collection.countDocuments({
          userId: { $in: [user._id, user._id.toString(), user._id.toHexString()] }
        });
        
        console.log(`   ${collectionName}: ${remainingCount} remaining documents`);
        
        if (remainingCount > 0) {
          // Show what's still there
          const remaining = await collection.find({
            userId: { $in: [user._id, user._id.toString(), user._id.toHexString()] }
          }).limit(3).toArray();
          
          console.log('   🚨 STILL FOUND:', remaining.map(d => ({
            _id: d._id,
            userId: d.userId,
            description: d.description || d.amount || d.date || 'unknown'
          })));
        }
      } catch (error) {
        console.log(`   ${collectionName}: Error checking - ${error.message}`);
      }
    }
    
    console.log('\n🎉 COMPLETE CLEANUP FINISHED!');
    console.log('✅ Database should now be completely clean');
    console.log('✅ Please try making a fresh booking now');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

completeCleanup();