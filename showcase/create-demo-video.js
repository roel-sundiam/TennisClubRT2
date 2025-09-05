const fs = require('fs-extra');
const path = require('path');

class DemoVideoCreator {
  constructor() {
    this.outputDir = 'video-output';
  }

  async init() {
    console.log('🎬 Tennis Club RT2 - Demo Video Creator');
    console.log('======================================');
    console.log('📹 Creating professional demo materials...\n');
    
    await fs.ensureDir(this.outputDir);
    return true;
  }

  async createVideoScript() {
    console.log('📝 Creating Video Production Guide...');
    
    const videoGuide = `# Tennis Club RT2 - Video Production Guide

## 🎬 Professional Demo Video Script

### Video Specifications
- **Duration**: 60 seconds
- **Resolution**: 1280x720 (720p) or 1920x1080 (1080p)
- **Frame Rate**: 30 fps
- **Format**: MP4 (H.264)

### Scene Breakdown

#### Scene 1: Introduction (0-8 seconds)
**Visual**: Tennis ball bouncing, club logo
**Text Overlay**: "Rich Town 2 Tennis Club - Complete Management System"
**Narration**: "Transform your tennis club with modern technology"

#### Scene 2: Member Dashboard (8-15 seconds)  
**Visual**: Clean dashboard interface
**Text Overlay**: "Smart Member Dashboard"
**Highlights**: 
- Quick stats and metrics
- Easy navigation
- Modern, senior-friendly design

#### Scene 3: Court Reservations (15-25 seconds)
**Visual**: Reservation calendar and booking flow
**Text Overlay**: "Smart Court Reservations"
**Highlights**:
- Dynamic pricing (Peak: ₱100, Off-peak: ₱20/player)
- Weather integration
- Real-time availability

#### Scene 4: Open Play System (25-35 seconds)
**Visual**: Open play voting and match generation
**Text Overlay**: "Automated Open Play Tournaments"
**Highlights**:
- Vote-based participation
- Automatic fair match generation
- Tournament bracket creation

#### Scene 5: Admin Features (35-45 seconds)
**Visual**: Admin dashboard with reports
**Text Overlay**: "Comprehensive Admin Tools"
**Highlights**:
- Member management
- Financial reports
- System analytics

#### Scene 6: Mobile Experience (45-52 seconds)
**Visual**: Mobile phone showing responsive design
**Text Overlay**: "Mobile-First PWA Design"
**Highlights**:
- Installable app
- Offline support
- Large touch targets for seniors

#### Scene 7: Conclusion (52-60 seconds)
**Visual**: Logo with contact information
**Text Overlay**: "Ready to modernize your tennis club?"
**Call-to-Action**: Contact information or demo request

---

## 🎨 Visual Assets Needed

### Screenshots to Capture
1. **Login page** - Clean, professional entry point
2. **Member dashboard** - Overview with statistics
3. **Court reservation** - Calendar and booking interface
4. **Weather integration** - Weather widget in action
5. **Open play voting** - Poll interface
6. **Member directory** - Professional member cards
7. **Coin system** - Innovative rewards interface
8. **Rankings** - Leaderboard and seeding points
9. **Admin dashboard** - Management overview
10. **Financial reports** - Revenue analytics
11. **Mobile views** - Responsive design demonstration

### Text Overlays
- Use clean, modern fonts (Arial, Helvetica, or similar)
- White text with dark shadow for readability
- Position in lower third of screen
- Fade in/out animations (0.3 seconds)

### Transitions
- Smooth crossfades (0.5 seconds)
- Slide transitions for related features
- Zoom effects for emphasis

---

## 🛠 Production Tools

### Option 1: Professional Video Editing
**Recommended Software**:
- Adobe Premiere Pro
- Final Cut Pro
- DaVinci Resolve (Free)

### Option 2: Online Video Makers
**Simple Options**:
- Canva Video
- InVideo
- Loom (for screen recording)

### Option 3: Automated Tools
**AI-Powered**:
- RunwayML
- Pictory
- InVideo AI

---

## 📱 Quick Mobile Demo

### 30-Second Mobile Version
1. **Intro** (0-5s): Logo and title
2. **Mobile Dashboard** (5-12s): Touch-friendly interface
3. **Reservation Flow** (12-20s): Quick booking process
4. **PWA Features** (20-25s): Installation and offline use
5. **Outro** (25-30s): Call-to-action

---

## 🎯 Key Messages to Emphasize

### Unique Selling Points
1. **Senior-Friendly Design** - Large buttons, high contrast
2. **Automated Open Play** - Unique tournament system
3. **Dual Currency System** - Coins + Credits innovation
4. **Weather Integration** - Smart booking decisions
5. **PWA Technology** - App-like experience
6. **Comprehensive Management** - All-in-one solution

### Target Audience Appeals
- **Club Administrators**: Reduce workload, increase efficiency
- **Members**: Easy booking, community features
- **Seniors**: Accessibility and ease of use
- **Tech-Savvy Users**: Modern features and innovation

---

## 📊 Performance Metrics to Highlight

- **30+ Features** across member and admin interfaces
- **3 User Roles** with appropriate permissions
- **PWA Enabled** for mobile app experience
- **Weather API Integration** for smart decisions
- **Real-time Notifications** for open play events
- **Senior-Friendly Design** with 48px+ touch targets

---

## 🎬 Production Tips

### Filming Guidelines
1. Use consistent lighting across all screenshots
2. Ensure high contrast for text readability
3. Keep motion smooth and professional
4. Use consistent branding colors (#2196f3 blue, #4caf50 green)
5. Include subtle animations for engagement

### Audio Suggestions
- Upbeat, modern background music
- Professional voiceover (optional)
- Sound effects for transitions
- Keep audio levels consistent

### Export Settings
- **Quality**: High (minimum 1080p for presentations)
- **Bitrate**: 8-10 Mbps for good quality
- **Codec**: H.264 for compatibility
- **Audio**: AAC 128kbps

---

## 📤 Distribution Formats

### Full Demo (60s)
- Client presentations
- Website embedding
- Social media (LinkedIn, Facebook)

### Short Clips (15-30s)
- Instagram Stories/Reels
- Twitter videos
- Quick previews

### GIF Versions
- Email signatures
- Website previews
- Social media posts

This guide provides everything needed to create a professional demo video that showcases the Tennis Club RT2 system effectively.`;

    const guidePath = path.join(this.outputDir, 'Video_Production_Guide.md');
    await fs.writeFile(guidePath, videoGuide);
    
    console.log('✅ Video production guide created: ' + path.basename(guidePath));
    return guidePath;
  }

  async createAnimatedSlideshow() {
    console.log('📱 Creating Interactive Demo Slideshow...');
    
    const slideshowHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tennis Club RT2 - Interactive Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            color: #2c3e50;
            overflow: hidden;
            height: 100vh;
        }
        
        .demo-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .slide {
            display: none;
            text-align: center;
            max-width: 1000px;
            padding: 2rem;
            animation: slideIn 0.8s ease-out;
        }
        
        .slide.active { display: block; }
        
        .slide h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .slide h2 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            color: #1976d2;
        }
        
        .slide p {
            font-size: 1.3rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            opacity: 0.95;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }
        
        .feature-card {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            border: 1px solid rgba(255,255,255,0.6);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transform: translateY(20px);
            opacity: 0;
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.4s; }
        .feature-card:nth-child(4) { animation-delay: 0.6s; }
        
        .feature-card h3 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #1976d2;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 4rem;
            margin: 3rem 0;
            flex-wrap: wrap;
        }
        
        .stat {
            text-align: center;
            animation: pulse 2s infinite;
        }
        
        .stat-number {
            display: block;
            font-size: 4rem;
            font-weight: bold;
            color: #1976d2;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .stat-label {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 6px;
            background: #1976d2;
            transition: width linear;
            box-shadow: 0 0 10px rgba(25, 118, 210, 0.5);
        }
        
        .controls {
            position: absolute;
            bottom: 30px;
            right: 30px;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            background: rgba(25,118,210,0.1);
            border: 2px solid rgba(25,118,210,0.3);
            color: #1976d2;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .btn:hover {
            background: rgba(25,118,210,0.2);
            border-color: rgba(25,118,210,0.5);
            transform: translateY(-2px);
        }
        
        .slide-indicator {
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(25,118,210,0.1);
            color: #1976d2;
            padding: 10px 20px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(25,118,210,0.2);
            font-weight: 600;
        }
        
        @keyframes slideIn {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeInUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .mockup {
            width: 300px;
            height: 200px;
            background: rgba(255,255,255,0.7);
            border-radius: 15px;
            margin: 2rem auto;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(25,118,210,0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        @media (max-width: 768px) {
            .slide h1 { font-size: 2.5rem; }
            .slide h2 { font-size: 2rem; }
            .stats { gap: 2rem; }
            .stat-number { font-size: 3rem; }
            .feature-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="slide-indicator" id="slideIndicator">
            Slide 1 of 7
        </div>
        
        <!-- Slide 1: Introduction -->
        <div class="slide active">
            <div style="background: rgba(255,193,7,0.1); border: 2px solid rgba(255,193,7,0.3); border-radius: 15px; padding: 1rem; margin-bottom: 2rem; color: #e65100;">
                <strong>🔄 System Upgrade:</strong> Replacing existing application with modern solution
            </div>
            <h1>🎾 Rich Town 2</h1>
            <h2>New Tennis Club Management System</h2>
            <p>Complete, modern replacement for your current system - featuring enhanced functionality, better performance, and superior user experience</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">30+</span>
                    <span class="stat-label">New Features</span>
                </div>
                <div class="stat">
                    <span class="stat-number">PWA</span>
                    <span class="stat-label">Technology</span>
                </div>
                <div class="stat">
                    <span class="stat-number">100%</span>
                    <span class="stat-label">Improved</span>
                </div>
            </div>
        </div>
        
        <!-- Slide 2: Smart Reservations -->
        <div class="slide">
            <h2>📅 Smart Court Reservations</h2>
            <div class="mockup">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📅</div>
                    <div>Dynamic Pricing System</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Peak: ₱100 | Off-peak: ₱20/player</div>
                </div>
            </div>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>⏰ Dynamic Pricing</h3>
                    <p>Automatic peak/off-peak pricing based on time and demand</p>
                </div>
                <div class="feature-card">
                    <h3>🌤️ Weather Integration</h3>
                    <p>Real-time weather data helps members make informed booking decisions</p>
                </div>
            </div>
        </div>
        
        <!-- Slide 3: Open Play System -->
        <div class="slide">
            <h2>🏆 Automated Open Play</h2>
            <div class="mockup">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🗳️</div>
                    <div>Tournament Matching</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Vote → Algorithm → Fair Matches</div>
                </div>
            </div>
            <p>Unique system that creates fair doubles matches automatically through community voting and smart algorithms</p>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🗳️ Vote-Based</h3>
                    <p>Members vote to participate, system ensures fair representation</p>
                </div>
                <div class="feature-card">
                    <h3>⚖️ Fair Matching</h3>
                    <p>Algorithm creates balanced matches based on skill and availability</p>
                </div>
            </div>
        </div>
        
        <!-- Slide 4: Community Features -->
        <div class="slide">
            <h2>👥 Community & Social</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🪙 Dual Currency</h3>
                    <p>Innovative coin system based on page visits plus traditional credits</p>
                </div>
                <div class="feature-card">
                    <h3>📊 Rankings</h3>
                    <p>Player seeding points and leaderboard system for competitive play</p>
                </div>
                <div class="feature-card">
                    <h3>📲 Member Directory</h3>
                    <p>Connect and network with other club members easily</p>
                </div>
                <div class="feature-card">
                    <h3>💬 Feedback System</h3>
                    <p>Suggestions, polls, and community-driven improvements</p>
                </div>
            </div>
        </div>
        
        <!-- Slide 5: Admin Tools -->
        <div class="slide">
            <h2>👨‍💼 Administrative Excellence</h2>
            <div class="mockup">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📊</div>
                    <div>Admin Dashboard</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Complete Management Suite</div>
                </div>
            </div>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>👥 Member Management</h3>
                    <p>Complete approval workflow from registration to active membership</p>
                </div>
                <div class="feature-card">
                    <h3>💰 Financial Reports</h3>
                    <p>Revenue tracking, analytics, and comprehensive financial oversight</p>
                </div>
            </div>
        </div>
        
        <!-- Slide 6: Technical Excellence -->
        <div class="slide">
            <h2>⚡ Technical Innovation</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>📱 Progressive Web App</h3>
                    <p>Installable app with offline support and push notifications</p>
                </div>
                <div class="feature-card">
                    <h3>👴 Senior-Friendly</h3>
                    <p>Large 48px+ touch targets and high contrast design</p>
                </div>
                <div class="feature-card">
                    <h3>🔒 Enterprise Security</h3>
                    <p>JWT authentication, role-based access, and rate limiting</p>
                </div>
                <div class="feature-card">
                    <h3>🚀 Modern Stack</h3>
                    <p>Angular 20, Express.js, MongoDB with optimized performance</p>
                </div>
            </div>
        </div>
        
        <!-- Slide 7: Call to Action -->
        <div class="slide">
            <h1>🚀 Ready to Transform?</h1>
            <p style="font-size: 1.5rem; margin: 2rem 0;">Your Tennis Club Management Solution</p>
            <div class="mockup" style="height: 150px;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎾</div>
                    <div style="font-size: 1.5rem;">Rich Town 2 Tennis Club</div>
                    <div style="opacity: 0.8;">Modern • Accessible • Comprehensive</div>
                </div>
            </div>
            <p><strong>Perfect for:</strong> Club administrators, members, and tennis enthusiasts of all ages</p>
        </div>
        
        <div class="progress-bar" id="progressBar"></div>
        
        <div class="controls">
            <button class="btn" onclick="previousSlide()">⏮️ Previous</button>
            <button class="btn" onclick="togglePlay()" id="playBtn">⏸️ Pause</button>
            <button class="btn" onclick="nextSlide()">⏭️ Next</button>
            <button class="btn" onclick="restartDemo()">🔄 Restart</button>
        </div>
    </div>

    <script>
        let currentSlide = 0;
        let isPlaying = true;
        let timer = null;
        const slides = document.querySelectorAll('.slide');
        const slideDurations = [5000, 8000, 8000, 6000, 6000, 6000, 5000]; // milliseconds
        
        function updateIndicator() {
            document.getElementById('slideIndicator').textContent = 
                \`Slide \${currentSlide + 1} of \${slides.length}\`;
        }
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            updateIndicator();
            
            const duration = slideDurations[index];
            startProgress(duration);
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        function previousSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }
        
        function startProgress(duration) {
            clearTimeout(timer);
            const progressBar = document.getElementById('progressBar');
            progressBar.style.width = '0%';
            progressBar.style.transition = 'width ' + duration + 'ms linear';
            
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 10);
            
            if (isPlaying) {
                timer = setTimeout(nextSlide, duration);
            }
        }
        
        function togglePlay() {
            isPlaying = !isPlaying;
            const btn = document.getElementById('playBtn');
            btn.textContent = isPlaying ? '⏸️ Pause' : '▶️ Play';
            
            if (isPlaying) {
                const duration = slideDurations[currentSlide];
                const progressBar = document.getElementById('progressBar');
                const currentWidth = parseFloat(progressBar.style.width) || 0;
                const remainingTime = duration * (1 - currentWidth / 100);
                timer = setTimeout(nextSlide, remainingTime);
            } else {
                clearTimeout(timer);
            }
        }
        
        function restartDemo() {
            currentSlide = 0;
            isPlaying = true;
            document.getElementById('playBtn').textContent = '⏸️ Pause';
            showSlide(0);
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': previousSlide(); break;
                case 'ArrowRight': nextSlide(); break;
                case ' ': e.preventDefault(); togglePlay(); break;
                case 'Home': currentSlide = 0; showSlide(0); break;
                case 'End': currentSlide = slides.length - 1; showSlide(currentSlide); break;
            }
        });
        
        // Auto-start
        showSlide(0);
        
        console.log('🎾 Tennis Club RT2 Interactive Demo Ready!');
        console.log('Controls: Arrow keys, Spacebar to pause/play, Home/End to jump');
    </script>
</body>
</html>`;

    const slideshowPath = path.join(this.outputDir, 'tennis-club-rt2-demo.html');
    await fs.writeFile(slideshowPath, slideshowHTML);
    
    console.log('✅ Interactive demo slideshow created: ' + path.basename(slideshowPath));
    return slideshowPath;
  }

  async generate() {
    try {
      await this.init();
      
      const guide = await this.createVideoScript();
      const slideshow = await this.createAnimatedSlideshow();
      
      console.log('\n🎉 Demo Materials Created Successfully!');
      console.log('=====================================');
      console.log('📁 Output directory: ' + this.outputDir + '/');
      console.log('');
      console.log('📄 Files created:');
      console.log('   📖 ' + path.basename(guide) + ' - Complete production guide');
      console.log('   🎬 ' + path.basename(slideshow) + ' - Interactive demo slideshow');
      console.log('');
      console.log('🚀 Next Steps:');
      console.log('   1. Open ' + path.basename(slideshow) + ' in your browser for an interactive demo');
      console.log('   2. Use the production guide to create a professional video');
      console.log('   3. Share the slideshow for immediate presentations');
      console.log('');
      console.log('🎾 Your Tennis Club RT2 demo materials are ready!');
      
      return { guide, slideshow };
      
    } catch (error) {
      console.error('💥 Demo creation failed: ' + error.message);
      return null;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new DemoVideoCreator();
  creator.generate().catch(console.error);
}

module.exports = DemoVideoCreator;