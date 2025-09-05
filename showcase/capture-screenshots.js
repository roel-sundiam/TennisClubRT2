const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:4200',
  outputDir: 'screenshots',
  credentials: {
    member: { username: 'RoelSundiam', password: 'RT2Tennis' },
    admin: { username: 'superadmin', password: 'admin123' }
  },
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
};

// Key pages and features to capture
const PAGES = {
  // Public pages
  login: { url: '/login', title: 'User Login', requiresAuth: false },
  register: { url: '/register', title: 'User Registration', requiresAuth: false },
  
  // Member pages
  dashboard: { url: '/dashboard', title: 'Member Dashboard', requiresAuth: true, role: 'member' },
  reservations: { url: '/reservations', title: 'Court Reservations', requiresAuth: true, role: 'member' },
  myReservations: { url: '/my-reservations', title: 'My Bookings', requiresAuth: true, role: 'member' },
  payments: { url: '/payments', title: 'Payment Management', requiresAuth: true, role: 'member' },
  coins: { url: '/coins', title: 'Coin Dashboard', requiresAuth: true, role: 'member' },
  credits: { url: '/credits', title: 'Credit Management', requiresAuth: true, role: 'member' },
  members: { url: '/members', title: 'Member Directory', requiresAuth: true, role: 'member' },
  polls: { url: '/polls', title: 'Open Play Voting', requiresAuth: true, role: 'member' },
  rankings: { url: '/rankings', title: 'Player Rankings', requiresAuth: true, role: 'member' },
  weather: { url: '/weather', title: 'Weather Forecast', requiresAuth: true, role: 'member' },
  suggestions: { url: '/suggestions', title: 'Feedback System', requiresAuth: true, role: 'member' },
  rules: { url: '/rules', title: 'Rules & Regulations', requiresAuth: true, role: 'member' },
  profile: { url: '/profile', title: 'User Profile', requiresAuth: true, role: 'member' },
  
  // Admin pages
  adminMembers: { url: '/admin/members', title: 'Member Management', requiresAuth: true, role: 'admin' },
  adminReports: { url: '/admin/reports', title: 'Reports & Analytics', requiresAuth: true, role: 'admin' },
  adminPolls: { url: '/admin/polls', title: 'Poll Management', requiresAuth: true, role: 'admin' },
  adminCoins: { url: '/admin/coins', title: 'Admin Coin Management', requiresAuth: true, role: 'admin' },
  adminCredits: { url: '/admin/credits', title: 'Admin Credit Management', requiresAuth: true, role: 'admin' },
  adminSuggestions: { url: '/admin/suggestions', title: 'Admin Suggestions', requiresAuth: true, role: 'admin' },
  adminAnalytics: { url: '/admin/analytics', title: 'System Analytics', requiresAuth: true, role: 'admin' },
  financialReport: { url: '/admin/financial-report', title: 'Financial Reports', requiresAuth: true, role: 'admin' }
};

class ScreenshotCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotCount = 0;
  }

  async init() {
    console.log('🚀 Starting Tennis Club RT2 Screenshot Capture...');
    
    // Create output directory
    await fs.ensureDir(CONFIG.outputDir);
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('✅ Browser launched successfully');
  }

  async login(role = 'member') {
    console.log(`🔐 Logging in as ${role}...`);
    
    const credentials = CONFIG.credentials[role];
    if (!credentials) {
      throw new Error(`No credentials found for role: ${role}`);
    }

    await this.page.goto(`${CONFIG.baseUrl}/login`);
    await this.page.waitForSelector('input[name="username"], input[formControlName="username"]', { timeout: 10000 });
    
    // Fill login form
    await this.page.type('input[name="username"], input[formControlName="username"]', credentials.username);
    await this.page.type('input[name="password"], input[formControlName="password"]', credentials.password);
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log(`✅ Logged in as ${role} successfully`);
  }

  async captureScreenshot(pageName, pageConfig, viewport) {
    try {
      console.log(`📸 Capturing ${pageName} (${viewport.name})...`);
      
      // Set viewport
      await this.page.setViewport(viewport);
      
      // Navigate to page
      await this.page.goto(`${CONFIG.baseUrl}${pageConfig.url}`, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      // Wait for Angular to load
      await this.page.waitForTimeout(2000);
      
      // Wait for main content
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Special handling for specific pages
      await this.handleSpecialPages(pageName, pageConfig);
      
      // Take screenshot
      const filename = `${pageName}-${viewport.name}.png`;
      const filepath = path.join(CONFIG.outputDir, filename);
      
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png',
        quality: 90
      });
      
      this.screenshotCount++;
      console.log(`✅ Saved: ${filename}`);
      
      return filepath;
      
    } catch (error) {
      console.error(`❌ Failed to capture ${pageName} (${viewport.name}):`, error.message);
      return null;
    }
  }

  async handleSpecialPages(pageName, pageConfig) {
    // Add special handling for specific pages
    switch (pageName) {
      case 'reservations':
        // Wait for calendar/date picker to load
        await this.page.waitForSelector('mat-card, .reservation-form', { timeout: 5000 }).catch(() => {});
        break;
        
      case 'members':
        // Wait for member cards to load
        await this.page.waitForSelector('mat-card, .member-card', { timeout: 5000 }).catch(() => {});
        break;
        
      case 'polls':
        // Wait for polls/open play content
        await this.page.waitForSelector('mat-card, .poll-card', { timeout: 5000 }).catch(() => {});
        break;
        
      case 'dashboard':
        // Wait for dashboard cards
        await this.page.waitForSelector('mat-card, .dashboard-card', { timeout: 5000 }).catch(() => {});
        break;
        
      case 'adminMembers':
        // Wait for admin table
        await this.page.waitForSelector('mat-table, table', { timeout: 5000 }).catch(() => {});
        break;
    }
    
    // General wait for Material Design components
    await this.page.waitForTimeout(1000);
  }

  async captureAllPages() {
    console.log('📱 Starting comprehensive screenshot capture...');
    
    const results = {
      captured: [],
      failed: [],
      total: 0
    };
    
    // Capture public pages (no login required)
    for (const [pageName, pageConfig] of Object.entries(PAGES)) {
      if (!pageConfig.requiresAuth) {
        for (const viewport of CONFIG.viewports) {
          results.total++;
          const filepath = await this.captureScreenshot(pageName, pageConfig, viewport);
          if (filepath) {
            results.captured.push({ pageName, viewport: viewport.name, filepath });
          } else {
            results.failed.push({ pageName, viewport: viewport.name });
          }
        }
      }
    }
    
    // Capture member pages
    await this.login('member');
    for (const [pageName, pageConfig] of Object.entries(PAGES)) {
      if (pageConfig.requiresAuth && pageConfig.role === 'member') {
        for (const viewport of CONFIG.viewports) {
          results.total++;
          const filepath = await this.captureScreenshot(pageName, pageConfig, viewport);
          if (filepath) {
            results.captured.push({ pageName, viewport: viewport.name, filepath });
          } else {
            results.failed.push({ pageName, viewport: viewport.name });
          }
        }
      }
    }
    
    // Capture admin pages
    await this.login('admin');
    for (const [pageName, pageConfig] of Object.entries(PAGES)) {
      if (pageConfig.requiresAuth && pageConfig.role === 'admin') {
        for (const viewport of CONFIG.viewports) {
          results.total++;
          const filepath = await this.captureScreenshot(pageName, pageConfig, viewport);
          if (filepath) {
            results.captured.push({ pageName, viewport: viewport.name, filepath });
          } else {
            results.failed.push({ pageName, viewport: viewport.name });
          }
        }
      }
    }
    
    return results;
  }

  async generateManifest(results) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      appName: 'Tennis Club RT2',
      description: 'Rich Town 2 Tennis Club Management System',
      screenshots: {
        captured: results.captured.length,
        failed: results.failed.length,
        total: results.total
      },
      features: {
        'PWA Capabilities': 'Installable progressive web app with offline support',
        'User Registration': 'Multi-step approval system with admin oversight',
        'Court Reservations': 'Dynamic pricing with weather integration',
        'Open Play System': 'Automated tournament matching system',
        'Coin Economy': 'Page visit economy with admin management',
        'Credit System': 'Prepaid reservation credits',
        'Member Directory': 'Browse and connect with other players',
        'Player Rankings': 'Seeding points and leaderboards',
        'Admin Dashboard': 'Comprehensive member and system management',
        'Financial Reports': 'Revenue tracking and analytics',
        'Real-time Notifications': 'PWA push notifications for open play',
        'Weather Integration': 'OpenWeather API for smart booking decisions',
        'Senior-Friendly UI': 'Large buttons and high contrast design'
      },
      pages: PAGES,
      viewports: CONFIG.viewports,
      files: results.captured,
      errors: results.failed
    };
    
    await fs.writeJSON(path.join(CONFIG.outputDir, 'manifest.json'), manifest, { spaces: 2 });
    console.log('📋 Generated manifest.json');
    
    return manifest;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      const results = await this.captureAllPages();
      const manifest = await this.generateManifest(results);
      
      console.log('\n🎉 Screenshot Capture Complete!');
      console.log(`📸 Captured: ${results.captured.length}/${results.total} screenshots`);
      console.log(`❌ Failed: ${results.failed.length} screenshots`);
      console.log(`📁 Output directory: ${CONFIG.outputDir}/`);
      
      if (results.failed.length > 0) {
        console.log('\n❌ Failed screenshots:');
        results.failed.forEach(item => {
          console.log(`   - ${item.pageName} (${item.viewport})`);
        });
      }
      
    } catch (error) {
      console.error('💥 Capture failed:', error);
    } finally {
      await this.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const capture = new ScreenshotCapture();
  capture.run().catch(console.error);
}

module.exports = ScreenshotCapture;