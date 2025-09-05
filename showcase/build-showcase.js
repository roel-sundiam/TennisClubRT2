const fs = require('fs-extra');
const path = require('path');

class ShowcaseBuilder {
  constructor() {
    this.outputDir = 'showcase-web';
    this.screenshotDir = 'screenshots';
  }

  async init() {
    console.log('🌟 Building Interactive Tennis Club RT2 Showcase...');
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(path.join(this.outputDir, 'assets'));
    await fs.ensureDir(path.join(this.outputDir, 'assets', 'images'));
  }

  async copyScreenshots() {
    try {
      const screenshotExists = await fs.pathExists(this.screenshotDir);
      if (screenshotExists) {
        await fs.copy(this.screenshotDir, path.join(this.outputDir, 'assets', 'screenshots'));
        console.log('📸 Screenshots copied to showcase');
      } else {
        console.log('⚠️ No screenshots found - generating placeholder images');
        await this.generatePlaceholders();
      }
    } catch (error) {
      console.log('⚠️ Error copying screenshots, using placeholders');
      await this.generatePlaceholders();
    }
  }

  async generatePlaceholders() {
    // Create placeholder data for when screenshots aren't available
    const placeholders = [
      { name: 'dashboard-desktop.png', title: 'Member Dashboard' },
      { name: 'reservations-desktop.png', title: 'Court Reservations' },
      { name: 'polls-desktop.png', title: 'Open Play System' },
      { name: 'members-desktop.png', title: 'Member Directory' },
      { name: 'adminMembers-desktop.png', title: 'Admin Dashboard' }
    ];

    for (const placeholder of placeholders) {
      const placeholderPath = path.join(this.outputDir, 'assets', 'screenshots', placeholder.name);
      await fs.ensureFile(placeholderPath);
      // Create a simple text file as placeholder
      await fs.writeFile(placeholderPath, `Placeholder for ${placeholder.title}`);
    }
  }

  generateHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tennis Club RT2 - Feature Showcase</title>
    <link rel="stylesheet" href="assets/css/showcase.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
    <div class="showcase-container">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-content">
                <div class="hero-badge">
                    <span class="badge-icon">🎾</span>
                    <span>Tennis Club Management</span>
                </div>
                <h1 class="hero-title">
                    Rich Town 2 Tennis Club
                    <span class="highlight">Management System</span>
                </h1>
                <p class="hero-description">
                    A comprehensive, senior-friendly PWA for court reservations, 
                    member management, and community engagement. Built with Angular 20 
                    and modern web technologies.
                </p>
                <div class="hero-stats">
                    <div class="stat">
                        <span class="stat-number">30+</span>
                        <span class="stat-label">Features</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">3</span>
                        <span class="stat-label">User Roles</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">PWA</span>
                        <span class="stat-label">Enabled</span>
                    </div>
                </div>
                <div class="hero-actions">
                    <button class="btn-primary" onclick="startShowcase()">
                        <span class="material-icons">play_arrow</span>
                        Start Showcase
                    </button>
                    <button class="btn-secondary" onclick="scrollToFeatures()">
                        <span class="material-icons">apps</span>
                        View Features
                    </button>
                </div>
            </div>
            <div class="hero-visual">
                <div class="phone-mockup">
                    <div class="phone-screen">
                        <img src="assets/screenshots/dashboard-mobile.png" alt="Mobile App Preview" id="hero-screenshot">
                    </div>
                </div>
                <div class="floating-cards">
                    <div class="floating-card card-1">
                        <span class="material-icons">calendar_today</span>
                        <span>Court Booking</span>
                    </div>
                    <div class="floating-card card-2">
                        <span class="material-icons">people</span>
                        <span>Member Directory</span>
                    </div>
                    <div class="floating-card card-3">
                        <span class="material-icons">monetization_on</span>
                        <span>Coin System</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Feature Categories -->
        <section class="features-section" id="features">
            <div class="section-header">
                <h2>Complete Tennis Club Solution</h2>
                <p>Discover all the features that make this system unique</p>
            </div>

            <div class="feature-categories">
                <div class="category-nav">
                    <button class="category-btn active" data-category="member">
                        <span class="material-icons">person</span>
                        Member Features
                    </button>
                    <button class="category-btn" data-category="admin">
                        <span class="material-icons">admin_panel_settings</span>
                        Admin Tools
                    </button>
                    <button class="category-btn" data-category="technical">
                        <span class="material-icons">code</span>
                        Technical
                    </button>
                </div>

                <!-- Member Features -->
                <div class="feature-grid active" data-category="member">
                    <div class="feature-card" data-feature="reservations">
                        <div class="feature-icon">
                            <span class="material-icons">calendar_today</span>
                        </div>
                        <h3>Smart Court Reservations</h3>
                        <p>Dynamic pricing system with peak/off-peak hours. Weather integration for informed booking decisions.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Dynamic Pricing</span>
                            <span class="highlight-tag">Weather API</span>
                            <span class="highlight-tag">Multi-Player</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="openplay">
                        <div class="feature-icon">
                            <span class="material-icons">how_to_vote</span>
                        </div>
                        <h3>Automated Open Play</h3>
                        <p>Unique tournament system that creates fair doubles matches automatically. Vote-based participation with smart algorithms.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Auto Matching</span>
                            <span class="highlight-tag">Fair Play</span>
                            <span class="highlight-tag">Voting System</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="coins">
                        <div class="feature-icon">
                            <span class="material-icons">monetization_on</span>
                        </div>
                        <h3>Dual Currency System</h3>
                        <p>Innovative coin economy based on page visits plus traditional credit system for reservations.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Page Economy</span>
                            <span class="highlight-tag">Credits</span>
                            <span class="highlight-tag">Rewards</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="community">
                        <div class="feature-icon">
                            <span class="material-icons">people</span>
                        </div>
                        <h3>Community Features</h3>
                        <p>Member directory, player rankings, polls, and feedback system to build a strong tennis community.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Directory</span>
                            <span class="highlight-tag">Rankings</span>
                            <span class="highlight-tag">Social</span>
                        </div>
                    </div>
                </div>

                <!-- Admin Features -->
                <div class="feature-grid" data-category="admin">
                    <div class="feature-card" data-feature="member-management">
                        <div class="feature-icon">
                            <span class="material-icons">people_alt</span>
                        </div>
                        <h3>Member Management</h3>
                        <p>Complete user approval workflow from registration to active membership with fee tracking.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Approval Flow</span>
                            <span class="highlight-tag">Fee Tracking</span>
                            <span class="highlight-tag">Role Management</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="analytics">
                        <div class="feature-icon">
                            <span class="material-icons">analytics</span>
                        </div>
                        <h3>Reports & Analytics</h3>
                        <p>Comprehensive financial reports, court usage statistics, and member activity analytics.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Revenue Reports</span>
                            <span class="highlight-tag">Usage Stats</span>
                            <span class="highlight-tag">Activity Tracking</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="financial">
                        <div class="feature-icon">
                            <span class="material-icons">account_balance</span>
                        </div>
                        <h3>Financial Control</h3>
                        <p>Advanced coin and credit management with audit trails and approval workflows.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Audit Trail</span>
                            <span class="highlight-tag">Multi-tier Approval</span>
                            <span class="highlight-tag">Balance Control</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="system">
                        <div class="feature-icon">
                            <span class="material-icons">settings</span>
                        </div>
                        <h3>System Management</h3>
                        <p>Poll management, suggestion handling, and comprehensive system configuration tools.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Poll Control</span>
                            <span class="highlight-tag">Feedback System</span>
                            <span class="highlight-tag">Configuration</span>
                        </div>
                    </div>
                </div>

                <!-- Technical Features -->
                <div class="feature-grid" data-category="technical">
                    <div class="feature-card" data-feature="pwa">
                        <div class="feature-icon">
                            <span class="material-icons">get_app</span>
                        </div>
                        <h3>Progressive Web App</h3>
                        <p>Full PWA with offline support, push notifications, and installable app shortcuts.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Installable</span>
                            <span class="highlight-tag">Offline Ready</span>
                            <span class="highlight-tag">Push Notifications</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="architecture">
                        <div class="feature-icon">
                            <span class="material-icons">architecture</span>
                        </div>
                        <h3>Modern Architecture</h3>
                        <p>Angular 20 standalone components, Express.js backend, MongoDB with optimized indexes.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Angular 20</span>
                            <span class="highlight-tag">Express.js</span>
                            <span class="highlight-tag">MongoDB</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="security">
                        <div class="feature-icon">
                            <span class="material-icons">security</span>
                        </div>
                        <h3>Enterprise Security</h3>
                        <p>JWT authentication, role-based access control, rate limiting, and multi-layer validation.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">JWT Auth</span>
                            <span class="highlight-tag">RBAC</span>
                            <span class="highlight-tag">Rate Limiting</span>
                        </div>
                    </div>

                    <div class="feature-card" data-feature="design">
                        <div class="feature-icon">
                            <span class="material-icons">palette</span>
                        </div>
                        <h3>Senior-Friendly Design</h3>
                        <p>Large 48px+ touch targets, high contrast colors, and glassmorphism effects for modern appeal.</p>
                        <div class="feature-highlights">
                            <span class="highlight-tag">Accessibility</span>
                            <span class="highlight-tag">Large Buttons</span>
                            <span class="highlight-tag">Glassmorphism</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Screenshot Gallery -->
        <section class="gallery-section" id="gallery">
            <div class="section-header">
                <h2>App Screenshots</h2>
                <p>See the application in action across different devices</p>
            </div>

            <div class="device-selector">
                <button class="device-btn active" data-device="desktop">
                    <span class="material-icons">desktop_windows</span>
                    Desktop
                </button>
                <button class="device-btn" data-device="tablet">
                    <span class="material-icons">tablet</span>
                    Tablet
                </button>
                <button class="device-btn" data-device="mobile">
                    <span class="material-icons">phone_android</span>
                    Mobile
                </button>
            </div>

            <div class="screenshot-gallery">
                <div class="gallery-container active" data-device="desktop">
                    <div class="screenshot-grid">
                        <!-- Desktop screenshots will be populated by JavaScript -->
                    </div>
                </div>
                <div class="gallery-container" data-device="tablet">
                    <div class="screenshot-grid">
                        <!-- Tablet screenshots will be populated by JavaScript -->
                    </div>
                </div>
                <div class="gallery-container" data-device="mobile">
                    <div class="screenshot-grid">
                        <!-- Mobile screenshots will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Technical Specs -->
        <section class="specs-section">
            <div class="section-header">
                <h2>Technical Specifications</h2>
                <p>Built with modern technologies and best practices</p>
            </div>

            <div class="specs-grid">
                <div class="spec-card">
                    <h3>Frontend</h3>
                    <ul>
                        <li>Angular 20 (Standalone Components)</li>
                        <li>Angular Material Design</li>
                        <li>Progressive Web App</li>
                        <li>Service Worker</li>
                        <li>Responsive Design</li>
                    </ul>
                </div>

                <div class="spec-card">
                    <h3>Backend</h3>
                    <ul>
                        <li>Express.js with TypeScript</li>
                        <li>MongoDB with Mongoose</li>
                        <li>JWT Authentication</li>
                        <li>Rate Limiting</li>
                        <li>OpenWeather API</li>
                    </ul>
                </div>

                <div class="spec-card">
                    <h3>Features</h3>
                    <ul>
                        <li>Real-time Notifications</li>
                        <li>Offline Support</li>
                        <li>Multi-role System</li>
                        <li>Payment Processing</li>
                        <li>Analytics Dashboard</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <div class="cta-content">
                <h2>Ready to Transform Your Tennis Club?</h2>
                <p>Get started with the most comprehensive tennis club management system</p>
                <div class="cta-actions">
                    <button class="btn-primary" onclick="downloadShowcase()">
                        <span class="material-icons">download</span>
                        Download Screenshots
                    </button>
                    <button class="btn-secondary" onclick="viewSource()">
                        <span class="material-icons">code</span>
                        View Source Code
                    </button>
                </div>
            </div>
        </section>
    </div>

    <!-- Screenshot Modal -->
    <div class="modal-overlay" id="screenshotModal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <span class="material-icons">close</span>
            </button>
            <img src="" alt="Screenshot" id="modalImage">
            <div class="modal-info">
                <h3 id="modalTitle"></h3>
                <p id="modalDescription"></p>
            </div>
        </div>
    </div>

    <script src="assets/js/showcase.js"></script>
</body>
</html>`;
  }

  generateCSS() {
    return `/* Tennis Club RT2 Showcase Styles */
:root {
  --primary-color: #2196f3;
  --primary-dark: #1976d2;
  --secondary-color: #4caf50;
  --accent-color: #ff9800;
  --background: #f5f7fa;
  --surface: #ffffff;
  --text-primary: #212121;
  --text-secondary: #757575;
  --border: #e0e0e0;
  --shadow: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-hover: 0 4px 16px rgba(0,0,0,0.15);
  --glassmorphism: rgba(255, 255, 255, 0.1);
  --glassmorphism-border: rgba(255, 255, 255, 0.2);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--background);
  scroll-behavior: smooth;
}

.showcase-container {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  flex: 1;
  max-width: 600px;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--glassmorphism);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glassmorphism-border);
  border-radius: 50px;
  padding: 0.5rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.badge-icon {
  font-size: 1.2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1rem;
}

.hero-title .highlight {
  background: linear-gradient(45deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  max-width: 500px;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--secondary-color);
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
}

.btn-secondary {
  background: var(--glassmorphism);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glassmorphism-border);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Hero Visual */
.hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
}

.phone-mockup {
  width: 300px;
  height: 600px;
  background: #1a1a1a;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
}

.phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: var(--background);
}

.phone-screen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-cards {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-card {
  position: absolute;
  background: var(--glassmorphism);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glassmorphism-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: float 6s ease-in-out infinite;
}

.floating-card .material-icons {
  font-size: 1.5rem;
  color: var(--secondary-color);
}

.card-1 {
  top: 20%;
  left: -20%;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: -25%;
  animation-delay: 2s;
}

.card-3 {
  bottom: 20%;
  left: -15%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Features Section */
.features-section {
  padding: 6rem 2rem;
  background: var(--surface);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.section-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.feature-categories {
  max-width: 1200px;
  margin: 0 auto;
}

.category-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: white;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.category-btn:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.feature-grid {
  display: none;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.feature-grid.active {
  display: grid;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(45deg, var(--primary-color), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.feature-icon .material-icons {
  color: white;
  font-size: 24px;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.feature-highlights {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.highlight-tag {
  background: rgba(33, 150, 243, 0.1);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(33, 150, 243, 0.2);
}

/* Gallery Section */
.gallery-section {
  padding: 6rem 2rem;
  background: var(--background);
}

.device-selector {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.device-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-btn.active {
  border-color: var(--secondary-color);
  background: var(--secondary-color);
  color: white;
}

.device-btn:hover {
  border-color: var(--secondary-color);
  transform: translateY(-1px);
}

.screenshot-gallery {
  max-width: 1400px;
  margin: 0 auto;
}

.gallery-container {
  display: none;
}

.gallery-container.active {
  display: block;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.screenshot-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
}

.screenshot-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.screenshot-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.screenshot-info {
  padding: 1rem;
}

.screenshot-info h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.screenshot-info p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Specs Section */
.specs-section {
  padding: 6rem 2rem;
  background: var(--surface);
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.spec-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border-left: 4px solid var(--primary-color);
}

.spec-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.spec-card ul {
  list-style: none;
}

.spec-card li {
  padding: 0.5rem 0;
  color: var(--text-secondary);
  position: relative;
  padding-left: 1.5rem;
}

.spec-card li::before {
  content: '•';
  color: var(--secondary-color);
  font-weight: bold;
  position: absolute;
  left: 0;
}

/* CTA Section */
.cta-section {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Modal */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.modal-overlay.active {
  display: flex;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content img {
  max-width: 100%;
  height: auto;
  display: block;
}

.modal-info {
  padding: 1.5rem;
}

.modal-info h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.modal-info p {
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
  
  .hero-stats {
    gap: 1rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .screenshot-grid {
    grid-template-columns: 1fr;
  }
  
  .specs-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-content h2 {
    font-size: 2rem;
  }
}

/* Animations */
.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

.slide-in-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.6s ease;
}

.slide-in-left.visible {
  opacity: 1;
  transform: translateX(0);
}

.slide-in-right {
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.6s ease;
}

.slide-in-right.visible {
  opacity: 1;
  transform: translateX(0);
}`;
  }

  generateJS() {
    return `// Tennis Club RT2 Showcase JavaScript
class TennisClubShowcase {
    constructor() {
        this.currentCategory = 'member';
        this.currentDevice = 'desktop';
        this.screenshots = {};
        this.init();
    }

    init() {
        this.loadScreenshots();
        this.setupEventListeners();
        this.setupAnimations();
        this.populateGallery();
        
        // Auto-cycle hero screenshot
        this.startHeroCycle();
    }

    loadScreenshots() {
        // Define available screenshots
        this.screenshots = {
            desktop: [
                { name: 'dashboard', title: 'Member Dashboard', description: 'Clean, modern dashboard with key metrics and quick actions' },
                { name: 'reservations', title: 'Court Reservations', description: 'Smart booking system with dynamic pricing and weather integration' },
                { name: 'polls', title: 'Open Play System', description: 'Automated tournament matching with vote-based participation' },
                { name: 'members', title: 'Member Directory', description: 'Browse and connect with other tennis club members' },
                { name: 'coins', title: 'Coin Management', description: 'Innovative page visit economy with rewards system' },
                { name: 'credits', title: 'Credit System', description: 'Prepaid reservation credits for convenient booking' },
                { name: 'rankings', title: 'Player Rankings', description: 'Seeding points and leaderboard system' },
                { name: 'weather', title: 'Weather Forecast', description: 'Integrated weather data for informed booking decisions' },
                { name: 'adminMembers', title: 'Admin Dashboard', description: 'Comprehensive member management and approval system' },
                { name: 'financialReport', title: 'Financial Reports', description: 'Revenue tracking and analytics dashboard' }
            ],
            tablet: [
                { name: 'dashboard', title: 'Dashboard (Tablet)', description: 'Optimized layout for tablet viewing' },
                { name: 'reservations', title: 'Reservations (Tablet)', description: 'Touch-friendly booking interface' },
                { name: 'members', title: 'Members (Tablet)', description: 'Grid layout optimized for tablet screens' }
            ],
            mobile: [
                { name: 'dashboard', title: 'Dashboard (Mobile)', description: 'Mobile-first design with large touch targets' },
                { name: 'reservations', title: 'Reservations (Mobile)', description: 'Streamlined mobile booking experience' },
                { name: 'polls', title: 'Open Play (Mobile)', description: 'Easy voting and tournament participation on mobile' }
            ]
        };
    }

    setupEventListeners() {
        // Category navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.switchCategory(category);
            });
        });

        // Device selector
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const device = e.currentTarget.dataset.device;
                this.switchDevice(device);
            });
        });

        // Feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const feature = e.currentTarget.dataset.feature;
                this.showFeatureDemo(feature);
            });
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.closest('.modal-close')) {
                this.closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Add fade-in animations to sections
        document.querySelectorAll('.feature-card, .spec-card, .screenshot-item').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Show/hide feature grids
        document.querySelectorAll('.feature-grid').forEach(grid => {
            grid.classList.toggle('active', grid.dataset.category === category);
        });
    }

    switchDevice(device) {
        this.currentDevice = device;
        
        // Update device selector
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.device === device);
        });

        // Show/hide gallery containers
        document.querySelectorAll('.gallery-container').forEach(container => {
            container.classList.toggle('active', container.dataset.device === device);
        });
    }

    populateGallery() {
        Object.keys(this.screenshots).forEach(device => {
            const container = document.querySelector(\`[data-device="\${device}"] .screenshot-grid\`);
            if (container) {
                container.innerHTML = '';
                
                this.screenshots[device].forEach(screenshot => {
                    const item = this.createScreenshotItem(screenshot, device);
                    container.appendChild(item);
                });
            }
        });
    }

    createScreenshotItem(screenshot, device) {
        const item = document.createElement('div');
        item.className = 'screenshot-item fade-in';
        
        const imgSrc = \`assets/screenshots/\${screenshot.name}-\${device}.png\`;
        
        item.innerHTML = \`
            <img src="\${imgSrc}" alt="\${screenshot.title}" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkludGVyLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2cHgiPiR7c2NyZWVuc2hvdC50aXRsZX08L3RleHQ+Cjwvc3ZnPg=='; this.alt='Screenshot placeholder';">
            <div class="screenshot-info">
                <h3>\${screenshot.title}</h3>
                <p>\${screenshot.description}</p>
            </div>
        \`;

        item.addEventListener('click', () => {
            this.openModal(imgSrc, screenshot.title, screenshot.description);
        });

        return item;
    }

    openModal(src, title, description) {
        const modal = document.getElementById('screenshotModal');
        const img = document.getElementById('modalImage');
        const titleEl = document.getElementById('modalTitle');
        const descEl = document.getElementById('modalDescription');

        img.src = src;
        titleEl.textContent = title;
        descEl.textContent = description;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('screenshotModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    showFeatureDemo(feature) {
        // Find corresponding screenshot for the feature
        const featureScreenshotMap = {
            'reservations': 'reservations',
            'openplay': 'polls',
            'coins': 'coins',
            'community': 'members',
            'member-management': 'adminMembers',
            'analytics': 'financialReport',
            'financial': 'coins',
            'system': 'adminMembers',
            'pwa': 'dashboard',
            'architecture': 'dashboard',
            'security': 'dashboard',
            'design': 'dashboard'
        };

        const screenshotName = featureScreenshotMap[feature] || 'dashboard';
        const screenshot = this.screenshots[this.currentDevice].find(s => s.name === screenshotName);
        
        if (screenshot) {
            const imgSrc = \`assets/screenshots/\${screenshot.name}-\${this.currentDevice}.png\`;
            this.openModal(imgSrc, screenshot.title, screenshot.description);
        }
    }

    startHeroCycle() {
        const heroScreenshots = ['dashboard-mobile.png', 'reservations-mobile.png', 'polls-mobile.png', 'members-mobile.png'];
        let currentIndex = 0;

        setInterval(() => {
            currentIndex = (currentIndex + 1) % heroScreenshots.length;
            const heroImg = document.getElementById('hero-screenshot');
            if (heroImg) {
                heroImg.src = \`assets/screenshots/\${heroScreenshots[currentIndex]}\`;
            }
        }, 4000);
    }
}

// Global functions
function startShowcase() {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

function downloadShowcase() {
    // Create a download link for screenshots
    const link = document.createElement('a');
    link.href = 'assets/screenshots/manifest.json';
    link.download = 'tennis-club-rt2-showcase.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function viewSource() {
    window.open('https://github.com/your-repo/tennis-club-rt2', '_blank');
}

function closeModal() {
    showcase.closeModal();
}

// Initialize showcase
let showcase;
document.addEventListener('DOMContentLoaded', () => {
    showcase = new TennisClubShowcase();
    
    // Add some visual flair
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TennisClubShowcase;
}`;
  }

  async build() {
    try {
      await this.init();
      await this.copyScreenshots();
      
      // Generate HTML
      const html = this.generateHTML();
      await fs.writeFile(path.join(this.outputDir, 'index.html'), html);
      
      // Generate CSS
      const css = this.generateCSS();
      await fs.ensureDir(path.join(this.outputDir, 'assets', 'css'));
      await fs.writeFile(path.join(this.outputDir, 'assets', 'css', 'showcase.css'), css);
      
      // Generate JavaScript
      const js = this.generateJS();
      await fs.ensureDir(path.join(this.outputDir, 'assets', 'js'));
      await fs.writeFile(path.join(this.outputDir, 'assets', 'js', 'showcase.js'), js);
      
      console.log('🎉 Interactive Showcase Built Successfully!');
      console.log('📁 Output directory: ' + this.outputDir + '/');
      console.log('🌐 Open index.html in your browser to view the showcase');
      
      return true;
    } catch (error) {
      console.error('💥 Build failed:', error);
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new ShowcaseBuilder();
  builder.build().catch(console.error);
}

module.exports = ShowcaseBuilder;