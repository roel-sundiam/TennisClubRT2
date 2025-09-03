import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

interface LegacyMember {
  _id?: any;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  membershipFeesPaid?: boolean;
  isActive?: boolean;
  registrationDate?: Date;
  createdAt?: Date;
  // Add other potential fields that might exist
  [key: string]: any;
}

const generateUsername = (fullName: string): string => {
  // Remove extra spaces and split by space
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length >= 2) {
    // Take first name and last name, remove non-alphanumeric characters
    const firstName = nameParts[0]?.replace(/[^a-zA-Z]/g, '') || '';
    const lastName = nameParts[nameParts.length - 1]?.replace(/[^a-zA-Z]/g, '') || '';
    return `${firstName}${lastName}`;
  } else {
    // If only one name, use it directly
    return nameParts[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'member';
  }
};

const generateEmail = (fullName: string): string => {
  const username = generateUsername(fullName).toLowerCase();
  return `${username}@tennisclub.com`;
};

const normalizeGender = (gender?: string): 'male' | 'female' | 'other' => {
  if (!gender) return 'other';
  
  const normalized = gender.toLowerCase().trim();
  if (normalized.includes('male') && !normalized.includes('female')) return 'male';
  if (normalized.includes('female')) return 'female';
  return 'other';
};

const importMembers = async () => {
  let legacyConnection: mongoose.Connection | null = null;
  let newConnection: mongoose.Connection | null = null;

  try {
    // Connect to legacy database
    const legacyUri = process.env.MONGODB_URI_LEGACY;
    if (!legacyUri) {
      throw new Error('MONGODB_URI_LEGACY environment variable is not defined');
    }

    console.log('🔗 Connecting to legacy database...');
    legacyConnection = mongoose.createConnection(legacyUri);
    
    // Define legacy member schema (flexible to handle different field names)
    const legacyMemberSchema = new mongoose.Schema({}, { strict: false, collection: 'Members' });
    const LegacyMember = legacyConnection.model('Member', legacyMemberSchema);

    // Connect to new database
    const newUri = process.env.MONGODB_URI;
    if (!newUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('🔗 Connecting to new database...');
    newConnection = mongoose.createConnection(newUri);
    const NewUser = newConnection.model('User', User.schema);

    // Fetch all legacy members
    console.log('📥 Fetching legacy members...');
    const legacyMembers = await LegacyMember.find({}).lean() as LegacyMember[];
    
    console.log(`📊 Found ${legacyMembers.length} legacy members`);

    if (legacyMembers.length === 0) {
      console.log('⚠️ No members found in legacy database');
      return;
    }

    // Process and import members
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const legacyMember of legacyMembers) {
      try {
        // Extract name from various possible field names
        const fullName = legacyMember.MemberName ||
                         legacyMember.fullName || 
                         legacyMember.name || 
                         `${legacyMember.firstName || ''} ${legacyMember.lastName || ''}`.trim();

        if (!fullName || fullName.length < 2) {
          console.log(`⚠️ Skipping member with invalid name:`, legacyMember);
          skippedCount++;
          continue;
        }

        // Skip special entries that aren't actual members
        if (fullName.includes("MEMBERS' DAY") || 
            fullName.includes("Homeowner's Time") ||
            fullName.toLowerCase().includes('time') ||
            fullName.toLowerCase().includes('day')) {
          console.log(`⚠️ Skipping special entry: ${fullName}`);
          skippedCount++;
          continue;
        }

        // Generate username and check for duplicates
        let username = generateUsername(fullName);
        let usernameCounter = 1;
        
        // Check if username already exists
        while (await NewUser.findOne({ username: username })) {
          username = `${generateUsername(fullName)}${usernameCounter}`;
          usernameCounter++;
        }

        // Generate email if not provided
        let email = legacyMember.email;
        if (!email || !email.includes('@')) {
          email = generateEmail(fullName);
          
          // Check if email already exists
          let emailCounter = 1;
          while (await NewUser.findOne({ email: email })) {
            const baseEmail = generateEmail(fullName);
            email = baseEmail.replace('@', `${emailCounter}@`);
            emailCounter++;
          }
        }

        // Check if user already exists by email
        const existingUser = await NewUser.findOne({ email: email });
        if (existingUser) {
          console.log(`⚠️ User with email ${email} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new user
        const newUser = new NewUser({
          username: username,
          fullName: fullName,
          email: email,
          password: 'RT2Tennis', // Default password as requested
          gender: normalizeGender(legacyMember.Gender || legacyMember.gender),
          phone: legacyMember.phone || undefined,
          dateOfBirth: legacyMember.dateOfBirth || undefined,
          isApproved: true, // Existing members are auto-approved
          isActive: legacyMember.isActive !== false, // Default to true unless explicitly false
          role: 'member',
          membershipFeesPaid: legacyMember.membershipFeesPaid !== false, // Default to true
          registrationDate: legacyMember.registrationDate || legacyMember.createdAt || new Date(),
          coinBalance: 100 // Give them starting coins
        });

        await newUser.save();
        importedCount++;
        
        console.log(`✅ Imported: ${fullName} -> ${username} (${email})`);

      } catch (error) {
        const errorMsg = `Error importing member ${legacyMember.name || 'unknown'}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        skippedCount++;
      }
    }

    // Summary
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} members`);
    console.log(`⚠️ Skipped: ${skippedCount} members`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n🎉 Member import completed!');
    console.log('\n📝 Note: All imported users have the default password "RT2Tennis"');
    console.log('Users should change their passwords after first login.');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    // Close connections
    if (legacyConnection) {
      await legacyConnection.close();
      console.log('📤 Disconnected from legacy database');
    }
    if (newConnection) {
      await newConnection.close();
      console.log('📤 Disconnected from new database');
    }
  }
};

// Run the import
importMembers().catch(console.error);