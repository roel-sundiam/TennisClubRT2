// Express.js Integration for Tennis Club RT2 Marketing Site
// Add this to your backend server to serve the marketing site

const express = require('express');
const path = require('path');

// Example integration for your Tennis Club RT2 backend
function setupMarketingRoutes(app) {
    // Serve marketing site static files
    const marketingPath = path.join(__dirname, '../marketing');
    
    // Route: /landing/* serves the marketing site
    app.use('/landing', express.static(marketingPath, {
        // Cache static assets for better performance
        maxAge: '1h',
        // Set proper MIME types
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            }
        }
    }));
    
    // Route: /landing (without slash) redirects to main marketing page
    app.get('/landing', (req, res) => {
        res.redirect('/landing/');
    });
    
    // Route: /marketing/* (alternative path)
    app.use('/marketing', express.static(marketingPath, { maxAge: '1h' }));
    
    // Route: /welcome/* (alternative path)
    app.use('/welcome', express.static(marketingPath, { maxAge: '1h' }));
    
    // Route: Catch-all for marketing site (SPA behavior)
    app.get('/landing/*', (req, res) => {
        res.sendFile(path.join(marketingPath, 'index.html'));
    });
    
    console.log('🎾 Marketing site available at:');
    console.log('   📍 /landing/');
    console.log('   📍 /marketing/');
    console.log('   📍 /welcome/');
}

// Example usage in your backend/server.js or app.js:
/*
const app = express();

// ... your existing routes ...

// Add marketing site routes
setupMarketingRoutes(app);

// ... rest of your app configuration ...
*/

module.exports = { setupMarketingRoutes };

// Alternative: Simple standalone server for marketing site only
if (require.main === module) {
    const app = express();
    const PORT = process.env.MARKETING_PORT || 3001;
    
    // Serve marketing site from root
    app.use('/', express.static(path.join(__dirname, '.'), { 
        maxAge: '1h',
        index: 'index.html'
    }));
    
    // Add security headers
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
    
    app.listen(PORT, () => {
        console.log(`🎾 Tennis Club RT2 Marketing Site running on http://localhost:${PORT}`);
    });
}