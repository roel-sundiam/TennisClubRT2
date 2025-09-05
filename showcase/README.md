# Tennis Club RT2 - Automated Showcase Generator

🎾 **Comprehensive showcase system for Rich Town 2 Tennis Club Management System**

This toolkit automatically generates professional screenshots, interactive web showcases, and promotional videos for the Tennis Club RT2 application.

## 🎯 What This Creates

### 1. **Automated Screenshots** 📸
- High-quality screenshots of all app features
- Desktop, tablet, and mobile viewports
- Both member and admin user perspectives
- Weather, reservations, member management, and more

### 2. **Interactive Web Showcase** 🌐
- Professional landing page with smooth animations
- Feature categories (Member, Admin, Technical)
- Responsive image gallery
- Modal lightbox for detailed views
- Glassmorphism design matching your app

### 3. **Professional Video** 🎬
- Automated video generation using FFmpeg
- Multiple sections showcasing different features
- Text overlays and smooth transitions
- Multiple format outputs (1080p, 720p, mobile, GIF)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Your Tennis Club RT2 app running on `http://localhost:4200`
- FFmpeg installed (for video generation only)

### 1. Install Dependencies
\`\`\`bash
cd showcase
npm install
\`\`\`

### 2. Generate Everything
\`\`\`bash
# Complete showcase generation
npm run generate-all

# Or run individually:
npm run capture      # Screenshots only
npm run showcase     # Web showcase only  
npm run video        # Video only
\`\`\`

### 3. View Results
\`\`\`bash
# Serve the interactive showcase
npm run serve
# Then open: http://localhost:8080
\`\`\`

## 📁 Output Structure

\`\`\`
showcase/
├── screenshots/           # All captured screenshots
│   ├── dashboard-desktop.png
│   ├── dashboard-mobile.png
│   ├── reservations-desktop.png
│   └── manifest.json      # Screenshot metadata
├── showcase-web/          # Interactive web showcase
│   ├── index.html
│   ├── assets/
│   │   ├── css/showcase.css
│   │   ├── js/showcase.js
│   │   └── screenshots/   # Copied screenshots
├── videos/                # Generated videos
│   ├── tennis-club-rt2-showcase.mp4      # Main video (1080p)
│   ├── tennis-club-rt2-showcase-720p.mp4 # 720p version
│   ├── tennis-club-rt2-showcase-mobile.mp4 # Mobile version
│   └── tennis-club-rt2-showcase-gif.gif  # GIF version
\`\`\`

## 🎨 Features Showcased

### Member Features
- **Smart Court Reservations** - Dynamic pricing with weather integration
- **Automated Open Play** - Vote-based tournament matching system  
- **Dual Currency System** - Coins + Credits for flexible payments
- **Community Features** - Member directory, rankings, polls
- **Weather Integration** - OpenWeather API for booking decisions
- **PWA Capabilities** - Installable app with offline support

### Admin Features  
- **Member Management** - Complete approval workflow
- **Financial Reports** - Revenue tracking and analytics
- **Coin Management** - Advanced financial control with audit trails
- **System Analytics** - Comprehensive metrics dashboard
- **Poll Management** - Control over community voting

### Technical Highlights
- **Progressive Web App** - Offline support, push notifications
- **Modern Architecture** - Angular 20, Express.js, MongoDB
- **Senior-Friendly Design** - Large buttons, high contrast
- **Enterprise Security** - JWT auth, RBAC, rate limiting

## 🛠 Configuration

### Screenshot Configuration
Edit \`capture-screenshots.js\`:
\`\`\`javascript
const CONFIG = {
  baseUrl: 'http://localhost:4200',  // Your app URL
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
\`\`\`

### Video Configuration
Edit \`create-video.js\`:
\`\`\`javascript
this.fps = 30;                    // Video frame rate
this.transitionDuration = 1;      // Seconds for transitions
this.sceneDuration = 4;           // Seconds per screenshot
\`\`\`

## 📸 Screenshot Coverage

The system captures screenshots of:

### Public Pages
- User login and registration forms
- PWA installation prompts

### Member Dashboard
- Clean dashboard with metrics and quick actions
- Court reservation system with calendar
- Open play voting and tournament system
- Member directory and player profiles
- Coin and credit management interfaces
- Payment history and transaction records
- Weather forecasts for booking decisions
- Player rankings and leaderboards
- Polls and community voting
- Feedback and suggestion system

### Admin Dashboard  
- Member management and approval system
- Financial reports and revenue analytics
- Coin and credit administration tools
- Poll and suggestion management
- System analytics and usage metrics
- Advanced configuration settings

### Responsive Views
All pages captured in desktop, tablet, and mobile viewports with:
- Large touch targets for senior users
- High contrast design elements
- Modern glassmorphism effects
- Material Design components

## 🎬 Video Structure

The generated video includes:

1. **Intro Section** (3s)
   - App title and branding
   - Key statistics (30+ features, PWA enabled)

2. **Member Features** (24s) 
   - Dashboard, reservations, open play
   - Coin system, member directory
   - Rankings and community features

3. **Admin Tools** (16s)
   - Member management, financial reports
   - System analytics, advanced controls

4. **Mobile Responsive** (12s)
   - Mobile-optimized interfaces
   - Touch-friendly design demonstration

5. **Technical Highlights** (2s)
   - Technology stack overview
   - PWA and architecture benefits

6. **Outro** (3s)
   - Final branding and call-to-action

**Total Duration: ~60 seconds** ⏱️

## 🔧 Troubleshooting

### Screenshots Not Capturing
1. Ensure your app is running on `http://localhost:4200`
2. Check that test credentials are valid
3. Verify Angular components are loading properly
4. Check browser console for JavaScript errors

### FFmpeg Not Found
1. Install FFmpeg: https://ffmpeg.org/download.html
2. Ensure it's in your system PATH
3. Test with: \`ffmpeg -version\`

### Low Quality Screenshots
1. Increase viewport sizes in configuration
2. Adjust Puppeteer screenshot quality settings
3. Ensure sufficient system memory

### Video Generation Fails
1. Check disk space (videos can be large)
2. Ensure all screenshots exist
3. Verify FFmpeg supports your system

## 🎨 Customization

### Branding
- Replace logo images in \`showcase-web/assets/images/\`
- Update colors in CSS variables
- Modify text content in \`build-showcase.js\`

### Additional Screenshots
Add new pages to \`PAGES\` object in \`capture-screenshots.js\`:
\`\`\`javascript
newFeature: { 
  url: '/new-feature', 
  title: 'New Feature', 
  requiresAuth: true, 
  role: 'member' 
}
\`\`\`

### Video Customization
- Modify video sections in \`create-video.js\`
- Adjust timing, transitions, and text overlays
- Add custom intro/outro footage

## 🚀 Deployment

### Web Showcase
The generated \`showcase-web/\` directory is a static site that can be:
- Hosted on Netlify, Vercel, or GitHub Pages
- Served from any web server
- Embedded in marketing websites

### Video Sharing
Generated videos are optimized for:
- **1080p**: High-quality presentations and demos
- **720p**: Social media and email marketing
- **Mobile**: WhatsApp and mobile sharing
- **GIF**: Quick previews and thumbnails

## 📊 Analytics

The showcase includes built-in analytics tracking:
- Feature interaction rates
- Screenshot view counts
- User engagement patterns
- Device and browser metrics

## 🤝 Contributing

To add new features to the showcase:
1. Add screenshot definitions to \`capture-screenshots.js\`
2. Update feature descriptions in \`build-showcase.js\`
3. Modify video sections in \`create-video.js\`
4. Test with \`npm run generate-all\`

## 📄 License

This showcase generator is part of the Tennis Club RT2 project.

---

**🎾 Built with passion for Rich Town 2 Tennis Club** 

Transform your tennis club management with modern technology and beautiful design!