const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class VideoCreator {
  constructor() {
    this.outputDir = 'videos';
    this.screenshotDir = 'screenshots';
    this.tempDir = 'temp';
    this.fps = 30;
    this.transitionDuration = 1; // seconds
    this.sceneDuration = 4; // seconds per screenshot
  }

  async init() {
    console.log('🎬 Starting Tennis Club RT2 Video Creation...');
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(this.tempDir);
    
    // Check if FFmpeg is available
    try {
      await execAsync('ffmpeg -version');
      console.log('✅ FFmpeg detected');
    } catch (error) {
      console.error('❌ FFmpeg not found. Please install FFmpeg to create videos.');
      console.log('Visit: https://ffmpeg.org/download.html');
      return false;
    }
    
    return true;
  }

  async createShowcaseVideo() {
    console.log('📹 Creating comprehensive showcase video...');
    
    const videoSections = [
      {
        name: 'intro',
        title: 'Tennis Club RT2 - Feature Showcase',
        subtitle: 'Rich Town 2 Tennis Club Management System',
        duration: 3
      },
      {
        name: 'member-features',
        title: 'Member Features',
        screenshots: [
          { name: 'dashboard-desktop.png', title: 'Member Dashboard', description: 'Clean dashboard with key metrics and quick actions' },
          { name: 'reservations-desktop.png', title: 'Smart Court Reservations', description: 'Dynamic pricing with weather integration' },
          { name: 'polls-desktop.png', title: 'Automated Open Play', description: 'Vote-based tournament system' },
          { name: 'coins-desktop.png', title: 'Coin Economy', description: 'Page visit rewards system' },
          { name: 'members-desktop.png', title: 'Member Directory', description: 'Connect with other players' },
          { name: 'rankings-desktop.png', title: 'Player Rankings', description: 'Seeding points and leaderboards' }
        ]
      },
      {
        name: 'admin-features',
        title: 'Administrative Tools',
        screenshots: [
          { name: 'adminMembers-desktop.png', title: 'Member Management', description: 'Complete user approval workflow' },
          { name: 'financialReport-desktop.png', title: 'Financial Reports', description: 'Revenue tracking and analytics' },
          { name: 'adminCoins-desktop.png', title: 'Coin Management', description: 'Advanced financial control' },
          { name: 'adminAnalytics-desktop.png', title: 'System Analytics', description: 'Comprehensive metrics dashboard' }
        ]
      },
      {
        name: 'mobile-responsive',
        title: 'Mobile-First Design',
        screenshots: [
          { name: 'dashboard-mobile.png', title: 'Mobile Dashboard', description: 'Optimized for touch devices' },
          { name: 'reservations-mobile.png', title: 'Mobile Booking', description: 'Large touch targets for seniors' },
          { name: 'polls-mobile.png', title: 'Mobile Open Play', description: 'Easy voting on mobile' }
        ]
      },
      {
        name: 'technical',
        title: 'Technical Highlights',
        subtitle: 'PWA • Angular 20 • Express.js • MongoDB',
        duration: 2
      },
      {
        name: 'outro',
        title: 'Rich Town 2 Tennis Club',
        subtitle: 'Complete Tennis Club Management Solution',
        duration: 3
      }
    ];

    // Create video segments
    const segments = [];
    for (const section of videoSections) {
      const segmentPath = await this.createSection(section);
      if (segmentPath) {
        segments.push(segmentPath);
      }
    }

    // Combine all segments
    const finalVideo = await this.combineSegments(segments, 'tennis-club-rt2-showcase.mp4');
    
    if (finalVideo) {
      console.log('🎉 Video creation complete!');
      console.log('📹 Output: ' + finalVideo);
      
      // Generate multiple formats
      await this.createMultipleFormats(finalVideo);
    }

    return finalVideo;
  }

  async createSection(section) {
    console.log(\`🎬 Creating section: \${section.title}\`);
    
    const sectionPath = path.join(this.tempDir, \`\${section.name}.mp4\`);
    
    if (section.screenshots) {
      // Screenshots section
      return await this.createScreenshotSection(section, sectionPath);
    } else {
      // Title card section
      return await this.createTitleCard(section, sectionPath);
    }
  }

  async createScreenshotSection(section, outputPath) {
    try {
      const inputPattern = path.join(this.tempDir, \`\${section.name}_%03d.png\`);
      let frameIndex = 0;
      
      // Create frames for each screenshot with transitions
      for (let i = 0; i < section.screenshots.length; i++) {
        const screenshot = section.screenshots[i];
        const screenshotPath = path.join(this.screenshotDir, screenshot.name);
        
        // Check if screenshot exists
        const exists = await fs.pathExists(screenshotPath);
        if (!exists) {
          console.log(\`⚠️ Screenshot not found: \${screenshot.name}, creating placeholder\`);
          await this.createPlaceholder(screenshotPath, screenshot.title);
        }

        // Create frames for this screenshot
        const framesPerScene = this.sceneDuration * this.fps;
        for (let frame = 0; frame < framesPerScene; frame++) {
          const framePath = path.join(this.tempDir, \`\${section.name}_\${String(frameIndex).padStart(3, '0')}.png\`);
          
          // Add text overlay
          await this.addTextOverlay(screenshotPath, framePath, screenshot.title, screenshot.description);
          frameIndex++;
        }
      }

      // Create video from frames
      const ffmpegCmd = \`ffmpeg -y -r \${this.fps} -i "\${inputPattern}" -c:v libx264 -pix_fmt yuv420p -crf 23 "\${outputPath}"\`;
      await execAsync(ffmpegCmd);
      
      // Cleanup frames
      const frames = await fs.readdir(this.tempDir);
      for (const frame of frames) {
        if (frame.startsWith(\`\${section.name}_\`) && frame.endsWith('.png')) {
          await fs.unlink(path.join(this.tempDir, frame));
        }
      }

      console.log(\`✅ Created section: \${section.name}\`);
      return outputPath;
      
    } catch (error) {
      console.error(\`❌ Failed to create section \${section.name}:\`, error.message);
      return null;
    }
  }

  async createTitleCard(section, outputPath) {
    try {
      const tempImage = path.join(this.tempDir, \`\${section.name}_title.png\`);
      
      // Create title card background
      const width = 1920;
      const height = 1080;
      
      let ffmpegCmd;
      if (section.name === 'intro' || section.name === 'outro') {
        // Gradient background for intro/outro
        ffmpegCmd = \`ffmpeg -y -f lavfi -i "color=#667eea:s=\${width}x\${height}" -f lavfi -i "color=#764ba2:s=\${width}x\${height}" -filter_complex "[0][1]blend=all_mode=multiply" -frames:v 1 "\${tempImage}"\`;
      } else {
        // Simple background for section titles
        ffmpegCmd = \`ffmpeg -y -f lavfi -i "color=#2196f3:s=\${width}x\${height}" -frames:v 1 "\${tempImage}"\`;
      }
      
      await execAsync(ffmpegCmd);

      // Add text overlays
      const textOverlayCmd = this.buildTextOverlayCommand(tempImage, tempImage, section.title, section.subtitle);
      await execAsync(textOverlayCmd);

      // Create video from static image
      const duration = section.duration || 2;
      const videoCmd = \`ffmpeg -y -loop 1 -i "\${tempImage}" -t \${duration} -c:v libx264 -pix_fmt yuv420p -crf 23 "\${outputPath}"\`;
      await execAsync(videoCmd);

      // Cleanup
      await fs.unlink(tempImage);

      console.log(\`✅ Created title card: \${section.name}\`);
      return outputPath;
      
    } catch (error) {
      console.error(\`❌ Failed to create title card \${section.name}:\`, error.message);
      return null;
    }
  }

  buildTextOverlayCommand(inputPath, outputPath, title, subtitle) {
    let filterComplex = '';
    let textColor = 'white';
    let titleSize = 72;
    let subtitleSize = 36;

    // Title text
    filterComplex += \`drawtext=text='\${title}':fontsize=\${titleSize}:fontcolor=\${textColor}:x=(w-text_w)/2:y=(h-text_h)/2-50:fontfile=/System/Library/Fonts/Arial.ttf\`;

    if (subtitle) {
      filterComplex += \`,drawtext=text='\${subtitle}':fontsize=\${subtitleSize}:fontcolor=\${textColor}:x=(w-text_w)/2:y=(h-text_h)/2+50:fontfile=/System/Library/Fonts/Arial.ttf\`;
    }

    return \`ffmpeg -y -i "\${inputPath}" -vf "\${filterComplex}" "\${outputPath}"\`;
  }

  async addTextOverlay(inputPath, outputPath, title, description) {
    try {
      const maxTitleLen = 40;
      const maxDescLen = 80;
      
      const truncatedTitle = title.length > maxTitleLen ? title.substring(0, maxTitleLen) + '...' : title;
      const truncatedDesc = description.length > maxDescLen ? description.substring(0, maxDescLen) + '...' : description;

      const filterComplex = \`drawbox=x=0:y=h-120:w=w:h=120:color=black@0.7,drawtext=text='\${truncatedTitle}':fontsize=48:fontcolor=white:x=40:y=h-100:fontfile=/System/Library/Fonts/Arial.ttf,drawtext=text='\${truncatedDesc}':fontsize=24:fontcolor=white:x=40:y=h-50:fontfile=/System/Library/Fonts/Arial.ttf\`;

      const cmd = \`ffmpeg -y -i "\${inputPath}" -vf "\${filterComplex}" "\${outputPath}"\`;
      await execAsync(cmd);
      
    } catch (error) {
      console.log(\`⚠️ Text overlay failed, copying original: \${error.message}\`);
      await fs.copy(inputPath, outputPath);
    }
  }

  async createPlaceholder(outputPath, title) {
    const width = 1920;
    const height = 1080;
    
    try {
      const cmd = \`ffmpeg -y -f lavfi -i "color=#f5f5f5:s=\${width}x\${height}" -vf "drawtext=text='Tennis Club RT2\\n\${title}\\n(Screenshot Placeholder)':fontsize=48:fontcolor=#666666:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Arial.ttf" -frames:v 1 "\${outputPath}"\`;
      await execAsync(cmd);
    } catch (error) {
      console.error('Failed to create placeholder:', error.message);
    }
  }

  async combineSegments(segments, outputFileName) {
    try {
      const outputPath = path.join(this.outputDir, outputFileName);
      const concatFile = path.join(this.tempDir, 'concat.txt');
      
      // Create concat file
      const concatContent = segments
        .filter(segment => segment && fs.pathExistsSync(segment))
        .map(segment => \`file '\${path.resolve(segment)}'\`)
        .join('\\n');
      
      await fs.writeFile(concatFile, concatContent);

      // Combine videos
      const combineCmd = \`ffmpeg -y -f concat -safe 0 -i "\${concatFile}" -c copy "\${outputPath}"\`;
      await execAsync(combineCmd);

      // Cleanup temp files
      await fs.unlink(concatFile);
      for (const segment of segments) {
        if (segment && await fs.pathExists(segment)) {
          await fs.unlink(segment);
        }
      }

      return outputPath;
      
    } catch (error) {
      console.error('❌ Failed to combine segments:', error.message);
      return null;
    }
  }

  async createMultipleFormats(inputVideo) {
    const baseName = path.basename(inputVideo, '.mp4');
    const formats = [
      { suffix: '-720p', scale: '1280:720', crf: 25 },
      { suffix: '-mobile', scale: '720:480', crf: 28 },
      { suffix: '-gif', scale: '640:480', fps: 10 }
    ];

    for (const format of formats) {
      try {
        const outputPath = path.join(this.outputDir, \`\${baseName}\${format.suffix}\${format.suffix === '-gif' ? '.gif' : '.mp4'}\`);
        
        let cmd;
        if (format.suffix === '-gif') {
          cmd = \`ffmpeg -y -i "\${inputVideo}" -vf "fps=\${format.fps},scale=\${format.scale}:flags=lanczos,palettegen" "\${this.tempDir}/palette.png" && ffmpeg -y -i "\${inputVideo}" -i "\${this.tempDir}/palette.png" -filter_complex "fps=\${format.fps},scale=\${format.scale}:flags=lanczos[x];[x][1:v]paletteuse" "\${outputPath}"\`;
        } else {
          cmd = \`ffmpeg -y -i "\${inputVideo}" -vf "scale=\${format.scale}" -crf \${format.crf} "\${outputPath}"\`;
        }
        
        await execAsync(cmd);
        console.log(\`✅ Created \${format.suffix} version\`);
        
      } catch (error) {
        console.log(\`⚠️ Failed to create \${format.suffix} version: \${error.message}\`);
      }
    }
  }

  async cleanup() {
    try {
      await fs.remove(this.tempDir);
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
  }

  async run() {
    try {
      const initialized = await this.init();
      if (!initialized) return false;

      const video = await this.createShowcaseVideo();
      
      if (video) {
        console.log('\\n🎉 Video Creation Complete!');
        console.log(\`📹 Main video: \${video}\`);
        console.log(\`📁 All outputs in: \${this.outputDir}/\`);
        console.log('\\n🚀 Ready to share your Tennis Club RT2 showcase!');
      }
      
      return true;
      
    } catch (error) {
      console.error('💥 Video creation failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new VideoCreator();
  creator.run().catch(console.error);
}

module.exports = VideoCreator;