const ScreenshotCapture = require('./capture-screenshots');
const ShowcaseBuilder = require('./build-showcase');
const VideoCreator = require('./create-video');
const fs = require('fs-extra');
const path = require('path');

class ShowcaseGenerator {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      screenshots: null,
      showcase: null,
      video: null,
      errors: []
    };
  }

  async run() {
    console.log('🎾 Tennis Club RT2 - Complete Showcase Generation');
    console.log('================================================');
    console.log('🚀 Starting comprehensive showcase creation...\n');

    try {
      // Step 1: Capture Screenshots
      console.log('📸 STEP 1: Capturing Screenshots');
      console.log('--------------------------------');
      await this.captureScreenshots();

      // Step 2: Build Interactive Showcase
      console.log('\n🌐 STEP 2: Building Interactive Showcase');
      console.log('----------------------------------------');
      await this.buildShowcase();

      // Step 3: Create Video
      console.log('\n🎬 STEP 3: Creating Promotional Video');
      console.log('------------------------------------');
      await this.createVideo();

      // Final Summary
      this.printSummary();

    } catch (error) {
      console.error('💥 Showcase generation failed:', error);
      process.exit(1);
    }
  }

  async captureScreenshots() {
    try {
      const capture = new ScreenshotCapture();
      await capture.run();
      this.results.screenshots = true;
      console.log('✅ Screenshots captured successfully');
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error.message);
      this.results.errors.push('Screenshots: ' + error.message);
      this.results.screenshots = false;
    }
  }

  async buildShowcase() {
    try {
      const builder = new ShowcaseBuilder();
      const success = await builder.build();
      this.results.showcase = success;
      
      if (success) {
        console.log('✅ Interactive showcase built successfully');
      } else {
        console.log('❌ Showcase build failed');
        this.results.errors.push('Showcase: Build process failed');
      }
    } catch (error) {
      console.error('❌ Showcase build failed:', error.message);
      this.results.errors.push('Showcase: ' + error.message);
      this.results.showcase = false;
    }
  }

  async createVideo() {
    try {
      const creator = new VideoCreator();
      const success = await creator.run();
      this.results.video = success;
      
      if (success) {
        console.log('✅ Video created successfully');
      } else {
        console.log('❌ Video creation failed');
        this.results.errors.push('Video: Creation process failed');
      }
    } catch (error) {
      console.error('❌ Video creation failed:', error.message);
      this.results.errors.push('Video: ' + error.message);
      this.results.video = false;
    }
  }

  async getDirectorySize(dirPath) {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) return 0;

      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let size = 0;

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }

      return size;
    } catch {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async countFiles(dirPath, extension = '') {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) return 0;

      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let count = 0;

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          count += await this.countFiles(fullPath, extension);
        } else if (!extension || file.name.endsWith(extension)) {
          count++;
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  async printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n🎉 SHOWCASE GENERATION COMPLETE!');
    console.log('================================');
    console.log(`⏱️  Total time: ${duration} seconds\n`);

    // Results summary
    const successCount = Object.values(this.results).filter(r => r === true).length;
    const totalSteps = 3;
    
    console.log('📊 RESULTS SUMMARY:');
    console.log(`✅ ${successCount}/${totalSteps} steps completed successfully`);
    console.log(`❌ ${this.results.errors.length} errors encountered\n`);

    // Detailed results
    console.log('📸 Screenshots:', this.results.screenshots ? '✅ Success' : '❌ Failed');
    console.log('🌐 Web Showcase:', this.results.showcase ? '✅ Success' : '❌ Failed');
    console.log('🎬 Video:', this.results.video ? '✅ Success' : '❌ Failed');

    if (this.results.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    // File statistics
    console.log('\n📁 OUTPUT STATISTICS:');
    
    const screenshotCount = await this.countFiles('screenshots', '.png');
    const screenshotSize = await this.getDirectorySize('screenshots');
    console.log(`📸 Screenshots: ${screenshotCount} files (${this.formatBytes(screenshotSize)})`);

    const showcaseSize = await this.getDirectorySize('showcase-web');
    console.log(`🌐 Web Showcase: ${this.formatBytes(showcaseSize)}`);

    const videoCount = await this.countFiles('videos', '.mp4') + await this.countFiles('videos', '.gif');
    const videoSize = await this.getDirectorySize('videos');
    console.log(`🎬 Videos: ${videoCount} files (${this.formatBytes(videoSize)})`);

    const totalSize = screenshotSize + showcaseSize + videoSize;
    console.log(`📊 Total Output: ${this.formatBytes(totalSize)}`);

    // Usage instructions
    console.log('\n🚀 NEXT STEPS:');
    
    if (this.results.showcase) {
      console.log('🌐 View Interactive Showcase:');
      console.log('   cd showcase && npm run serve');
      console.log('   Then open: http://localhost:8080');
    }

    if (this.results.screenshots) {
      console.log('📸 Screenshots available in: ./screenshots/');
    }

    if (this.results.video) {
      console.log('🎬 Videos available in: ./videos/');
      console.log('   - Main video: tennis-club-rt2-showcase.mp4');
      console.log('   - Multiple formats available (720p, mobile, GIF)');
    }

    console.log('\n📖 Documentation: See README.md for detailed usage instructions');

    // Feature showcase summary
    console.log('\n🎾 FEATURES SHOWCASED:');
    console.log('📱 Member Features:');
    console.log('   • Smart Court Reservations with Dynamic Pricing');
    console.log('   • Automated Open Play Tournament System');  
    console.log('   • Dual Currency System (Coins + Credits)');
    console.log('   • Community Features (Directory, Rankings, Polls)');
    console.log('   • Weather Integration for Smart Booking');

    console.log('👨‍💼 Admin Features:');
    console.log('   • Complete Member Management Workflow');
    console.log('   • Financial Reports and Revenue Analytics');
    console.log('   • Advanced Coin and Credit Administration');
    console.log('   • System Analytics and Usage Metrics');
    console.log('   • Poll and Community Management Tools');

    console.log('⚡ Technical Highlights:');
    console.log('   • Progressive Web App (PWA) with Offline Support');
    console.log('   • Angular 20 + Express.js + MongoDB Architecture');
    console.log('   • Senior-Friendly Design with Large Touch Targets');
    console.log('   • Enterprise Security (JWT, RBAC, Rate Limiting)');
    console.log('   • Real-time Notifications and Push Messages');

    console.log('\n🎯 Perfect for:');
    console.log('   • Client presentations and demos');
    console.log('   • Marketing materials and social media');
    console.log('   • Documentation and training resources');
    console.log('   • Portfolio showcase and case studies');

    if (successCount === totalSteps) {
      console.log('\n🏆 ALL SYSTEMS GO! Your Tennis Club RT2 showcase is ready to impress! 🎾');
    } else {
      console.log('\n⚠️  Some components failed. Check errors above and README.md for troubleshooting.');
    }
  }
}

// Add package.json script entries helper
async function updatePackageJson() {
  try {
    const packagePath = 'package.json';
    const packageExists = await fs.pathExists(packagePath);
    
    if (packageExists) {
      const pkg = await fs.readJSON(packagePath);
      
      // Add showcase scripts
      if (!pkg.scripts) pkg.scripts = {};
      
      Object.assign(pkg.scripts, {
        'generate-all': 'node generate-all.js',
        'capture': 'node capture-screenshots.js',
        'showcase': 'node build-showcase.js',
        'video': 'node create-video.js',
        'serve': 'http-server showcase-web -p 8080 -o'
      });

      await fs.writeJSON(packagePath, pkg, { spaces: 2 });
      console.log('✅ Updated package.json with showcase scripts');
    }
  } catch (error) {
    console.log('⚠️ Could not update package.json:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ShowcaseGenerator();
  
  // Update package.json first
  updatePackageJson().then(() => {
    // Then run the generator
    generator.run().catch(console.error);
  });
}

module.exports = ShowcaseGenerator;