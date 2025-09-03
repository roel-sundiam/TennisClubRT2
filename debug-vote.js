// Debug script to test vote validation
const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

async function debugVote() {
  console.log('🔍 Debugging vote validation...\n');

  try {
    // Test with invalid option ID format
    const invalidPayload = {
      optionIds: ['invalid-id']
    };

    console.log('Testing invalid option ID format:', invalidPayload);
    
    const response = await axios.post(
      `${baseURL}/polls/68aa7f70ec5fdc80e0495cd0/vote`,
      invalidPayload,
      {
        headers: {
          'Authorization': 'Bearer fake-token-for-testing'
        }
      }
    ).catch(err => {
      console.log('❌ Expected validation error:', err.response?.data);
      return { data: { error: 'Expected validation error' } };
    });

    // Test with valid MongoDB ObjectId format
    const validPayload = {
      optionIds: ['507f1f77bcf86cd799439011'] // Valid ObjectId format
    };

    console.log('\nTesting valid ObjectId format:', validPayload);
    
    const validResponse = await axios.post(
      `${baseURL}/polls/68aa7f70ec5fdc80e0495cd0/vote`,
      validPayload,
      {
        headers: {
          'Authorization': 'Bearer fake-token-for-testing'
        }
      }
    ).catch(err => {
      console.log('❌ Auth error (expected):', err.response?.data?.error);
      return { data: { error: 'Auth required' } };
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugVote();