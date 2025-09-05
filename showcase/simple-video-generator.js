const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class SimpleVideoGenerator {
  constructor() {
    this.baseUrl = 'http://localhost:4200';
    this.outputDir = 'video-output';
    this.tempDir = 'video-temp';
    this.credentials = {
      member: { username: 'RoelSundiam', password: 'RT2Tennis' },
      admin: { username: 'superadmin', password: 'admin123' }
    };
    
    // Video settings
    this.viewport = { width: 1280, height: 720 }; // 720p for better compatibility
    this.screenshotDelay = 2000; // Time to wait for page load
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🎬 Tennis Club RT2 - Simple Video Generator');
    console.log('==========================================');
    console.log('📹 Initializing video generation system...\n');
    
    // Create directories
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(this.tempDir);
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: this.viewport,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(this.viewport);
    
    console.log('✅ Browser launched successfully');
    return true;
  }

  async login(role = 'member') {
    console.log('🔐 Logging in as ' + role + '...');
    
    const credentials = this.credentials[role];
    await this.page.goto(this.baseUrl + '/login');
    await this.page.waitForSelector('input[name="username"], input[formControlName="username"]', { timeout: 10000 });
    
    // Fill login form
    await this.page.type('input[name="username"], input[formControlName="username"]', credentials.username);
    await this.page.type('input[name="password"], input[formControlName="password"]', credentials.password);
    
    // Submit and wait for navigation
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('✅ Login successful');
  }

  async captureScreenshot(pagePath, filename, title) {
    try {
      console.log('📸 Capturing: ' + title);
      
      // Navigate to page
      await this.page.goto(this.baseUrl + pagePath);
      await this.page.waitForTimeout(this.screenshotDelay);
      
      // Wait for main content
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Take screenshot
      const screenshotPath = path.join(this.tempDir, filename);
      await this.page.screenshot({
        path: screenshotPath,
        type: 'png',
        fullPage: false // Fixed viewport for video consistency
      });
      
      console.log('✅ Saved: ' + filename);
      return screenshotPath;
      
    } catch (error) {
      console.log('⚠️ Failed to capture ' + title + ': ' + error.message);
      return null;
    }
  }

  async captureAllScreenshots() {
    console.log('\n📱 Capturing App Screenshots');
    console.log('-----------------------------');
    
    const screenshots = [];
    
    // Define the story sequence for video
    const videoSequence = [
      // Introduction
      { path: '/login', filename: '01_login.png', title: 'Login Page', role: null, duration: 3 },
      
      // Member Experience
      { path: '/dashboard', filename: '02_dashboard.png', title: 'Member Dashboard', role: 'member', duration: 4 },
      { path: '/reservations', filename: '03_reservations.png', title: 'Court Reservations', role: 'member', duration: 5 },
      { path: '/weather', filename: '04_weather.png', title: 'Weather Integration', role: 'member', duration: 3 },
      { path: '/polls', filename: '05_openplay.png', title: 'Open Play System', role: 'member', duration: 4 },
      { path: '/members', filename: '06_members.png', title: 'Member Directory', role: 'member', duration: 3 },
      { path: '/coins', filename: '07_coins.png', title: 'Coin System', role: 'member', duration: 4 },
      { path: '/rankings', filename: '08_rankings.png', title: 'Player Rankings', role: 'member', duration: 3 },
      
      // Admin Features
      { path: '/admin/members', filename: '09_admin_members.png', title: 'Admin Dashboard', role: 'admin', duration: 4 },
      { path: '/admin/reports', filename: '10_admin_reports.png', title: 'Financial Reports', role: 'admin', duration: 4 },
      { path: '/admin/analytics', filename: '11_admin_analytics.png', title: 'System Analytics', role: 'admin', duration: 3 }
    ];
    
    let currentRole = null;
    
    for (const item of videoSequence) {
      // Login if role changed
      if (item.role && item.role !== currentRole) {
        await this.login(item.role);
        currentRole = item.role;
      }
      
      const screenshotPath = await this.captureScreenshot(item.path, item.filename, item.title);
      if (screenshotPath) {
        screenshots.push({
          path: screenshotPath,
          filename: item.filename,
          title: item.title,
          duration: item.duration
        });
      }
    }
    
    console.log('\n✅ Captured ' + screenshots.length + ' screenshots');
    return screenshots;
  }

  async createVideo(screenshots) {
    console.log('\n🎬 Creating Video');
    console.log('-----------------');
    
    try {
      // Check if FFmpeg is available
      await execAsync('ffmpeg -version');
      console.log('✅ FFmpeg detected');
    } catch (error) {
      console.log('❌ FFmpeg not found. Creating image slideshow instead...');
      return await this.createImageSlideshow(screenshots);
    }
    
    // Create video using FFmpeg
    const videoPath = path.join(this.outputDir, 'tennis-club-rt2-demo.mp4');
    
    // Create input list for FFmpeg
    const inputList = [];
    
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const duration = screenshot.duration || 3;
      
      // Add image with duration
      inputList.push('file \'' + path.resolve(screenshot.path) + '\'');
      inputList.push('duration ' + duration);
    }
    
    // Add last image again (FFmpeg requirement)
    if (screenshots.length > 0) {
      const lastScreenshot = screenshots[screenshots.length - 1];
      inputList.push('file \'' + path.resolve(lastScreenshot.path) + '\'');
    }
    
    const listFile = path.join(this.tempDir, 'input_list.txt');
    await fs.writeFile(listFile, inputList.join('\n'));
    
    // Create video with text overlays
    console.log('🎥 Generating MP4 video...');
    
    const ffmpegCommand = 'ffmpeg -y -f concat -safe 0 -i "' + listFile + '" -vf "scale=1280:720,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 23 "' + videoPath + '"';
    
    await execAsync(ffmpegCommand);
    
    console.log('✅ Video created: ' + videoPath);
    
    // Create additional formats
    await this.createAdditionalFormats(videoPath);
    
    return videoPath;
  }

  async createImageSlideshow(screenshots) {
    console.log('📋 Creating HTML slideshow (FFmpeg not available)');
    
    // Create HTML slideshow as fallback
    const slideshowHTML = this.generateSlideshowHTML(screenshots);
    const slideshowPath = path.join(this.outputDir, 'tennis-club-rt2-slideshow.html');
    
    await fs.writeFile(slideshowPath, slideshowHTML);
    
    console.log('✅ Slideshow created: ' + slideshowPath);
    console.log('💡 Open this file in your browser to view the slideshow');
    
    return slideshowPath;
  }

  generateSlideshowHTML(screenshots) {
    const imageSlides = screenshots.map((screenshot, index) => {
      const relativePath = path.relative(this.outputDir, screenshot.path).replace(/\\/g, '/');
      return `
        <div class="slide ${index === 0 ? 'active' : ''}" data-duration="${(screenshot.duration || 3) * 1000}">
          <img src="${relativePath}" alt="${screenshot.title}">
          <div class="slide-title">${screenshot.title}</div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tennis Club RT2 - Demo Slideshow</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        .slideshow-container {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        .slide {
            display: none;
            position: absolute;
            width: 100%;
            height: 100%;
            text-align: center;
        }
        .slide.active {
            display: block;
            animation: fadeIn 0.5s;
        }
        .slide img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .slide-title {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
        }
        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: #2196f3;
            transition: width linear;
        }
        .controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 100;
        }
        .btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 10px 15px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .btn:hover {
            background: rgba(255,255,255,0.4);
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .intro {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
        }
        .intro h1 {
            margin: 0 0 10px 0;
            color: #2196f3;
        }
    </style>
</head>
<body>
    <div class="slideshow-container">
        <div class="intro">
            <h1>🎾 Tennis Club RT2</h1>
            <p>Comprehensive Tennis Club Management System</p>
            <p><strong>Features:</strong> Court reservations, member management, open play system, and more!</p>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="previousSlide()">⏮️ Previous</button>
            <button class="btn" onclick="togglePlay()">⏸️ Pause</button>
            <button class="btn" onclick="nextSlide()">⏭️ Next</button>
        </div>
        
        ${imageSlides}
        
        <div class="progress-bar" id="progressBar"></div>
    </div>

    <script>
        let currentSlide = 0;
        let isPlaying = true;
        let timer = null;
        const slides = document.querySelectorAll('.slide');
        const progressBar = document.getElementById('progressBar');
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            
            const duration = parseInt(slides[index].dataset.duration);
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
            const btn = document.querySelector('.controls .btn:nth-child(2)');
            btn.textContent = isPlaying ? '⏸️ Pause' : '▶️ Play';
            
            if (isPlaying) {
                const duration = parseInt(slides[currentSlide].dataset.duration);
                const remainingTime = duration * (1 - parseFloat(progressBar.style.width) / 100);
                timer = setTimeout(nextSlide, remainingTime);
            } else {
                clearTimeout(timer);
            }
        }
        
        // Start slideshow
        showSlide(0);
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': previousSlide(); break;
                case 'ArrowRight': nextSlide(); break;
                case ' ': e.preventDefault(); togglePlay(); break;
            }
        });
    </script>
</body>
</html>`;
  }

  async createAdditionalFormats(videoPath) {
    console.log('🎨 Creating additional formats...');
    
    try {
      const baseName = path.basename(videoPath, '.mp4');
      const outputDir = path.dirname(videoPath);
      
      // Create GIF version
      const gifPath = path.join(outputDir, baseName + '.gif');
      const gifCommand = 'ffmpeg -y -i "' + videoPath + '" -vf "fps=10,scale=640:-1:flags=lanczos,palettegen" "' + this.tempDir + '/palette.png" && ffmpeg -y -i "' + videoPath + '" -i "' + this.tempDir + '/palette.png" -filter_complex "fps=10,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" "' + gifPath + '"';
      
      await execAsync(gifCommand);
      console.log('✅ GIF created: ' + path.basename(gifPath));
      
      // Create shorter version (first 30 seconds)
      const shortPath = path.join(outputDir, baseName + '-short.mp4');
      const shortCommand = 'ffmpeg -y -i "' + videoPath + '" -t 30 -c copy "' + shortPath + '"';
      
      await execAsync(shortCommand);
      console.log('✅ Short version created: ' + path.basename(shortPath));
      
    } catch (error) {
      console.log('⚠️ Could not create additional formats: ' + error.message);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    // Optionally clean up temp files
    try {
      await fs.remove(this.tempDir);
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.log('⚠️ Cleanup warning: ' + error.message);
    }
  }

  async generate() {
    try {
      await this.init();
      const screenshots = await this.captureAllScreenshots();
      
      if (screenshots.length > 0) {
        const output = await this.createVideo(screenshots);
        
        console.log('\n🎉 Video Generation Complete!');
        console.log('================================');
        console.log('📹 Output files in: ' + this.outputDir + '/');
        
        // List all created files
        const files = await fs.readdir(this.outputDir);
        files.forEach(file => {
          console.log('   📄 ' + file);
        });
        
        console.log('\n🚀 Your Tennis Club RT2 demo is ready to share!');
        
        return output;
      } else {
        console.log('❌ No screenshots captured. Please check your app is running.');
        return null;
      }
      
    } catch (error) {
      console.error('💥 Video generation failed: ' + error.message);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SimpleVideoGenerator();
  generator.generate().catch(console.error);
}

module.exports = SimpleVideoGenerator;