const axios = require('axios');

const AUDIT_SERVICE_URL = 'http://audit-service:4004';

const testLog = async () => {
  try {
    const response = await axios.post(`${AUDIT_SERVICE_URL}/log`, {
      actorId: '507f1f77bcf86cd799439011',
      action: 'TEST_ACTION',
      details: { test: true }
    }, {
      timeout: 3000
    });
    console.log('✅ SUCCESS:', response.data);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

testLog();
