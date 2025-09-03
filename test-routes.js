// Simple test script to check route registration
const express = require('express');
const app = express();

// Import the poll routes
try {
  const pollRoutes = require('./backend/dist/routes/pollRoutes.js');
  console.log('✅ Successfully imported pollRoutes');
  console.log('pollRoutes default export:', typeof pollRoutes.default);
  
  // Try to register the routes
  app.use('/api/polls', pollRoutes.default || pollRoutes);
  console.log('✅ Successfully registered poll routes');
  
  // Check the registered routes
  app._router.stack.forEach((r) => {
    if (r.route) {
      console.log(`Route: ${r.route.path}`);
    } else if (r.handle && r.handle.stack) {
      console.log(`Router middleware at: ${r.regexp}`);
      r.handle.stack.forEach((route) => {
        if (route.route) {
          console.log(`  Sub-route: ${route.route.path} [${Object.keys(route.route.methods).join(', ').toUpperCase()}]`);
        }
      });
    }
  });
  
} catch (error) {
  console.error('❌ Error importing pollRoutes:', error.message);
  console.error('Stack:', error.stack);
}