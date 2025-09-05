const fs = require('fs-extra');
const path = require('path');

class DemoDeployer {
  constructor() {
    this.sourceDir = 'video-output';
    this.targetDir = '../frontend/public/showcase/video-output';
  }

  async deploy() {
    console.log('📤 Deploying Video Demo to Frontend...');
    console.log('====================================');

    try {
      // Ensure target directory exists
      await fs.ensureDir(this.targetDir);
      console.log('✅ Target directory ready');

      // Copy demo files
      const filesToCopy = [
        'tennis-club-rt2-demo.html',
        'Video_Production_Guide.md'
      ];

      for (const file of filesToCopy) {
        const sourcePath = path.join(this.sourceDir, file);
        const targetPath = path.join(this.targetDir, file);
        
        const exists = await fs.pathExists(sourcePath);
        if (exists) {
          await fs.copy(sourcePath, targetPath);
          console.log(`✅ Copied: ${file}`);
        } else {
          console.log(`⚠️ File not found: ${file}`);
        }
      }

      console.log('\n🎉 Demo Deployment Complete!');
      console.log('📁 Files deployed to: frontend/public/showcase/video-output/');
      console.log('🌐 Accessible at: /showcase/video-output/tennis-club-rt2-demo.html');
      console.log('');
      console.log('🚀 The video demo is now available in your admin analytics page!');
      console.log('   Navigate to: /admin/analytics');
      console.log('   Click the "Video Demo" button in the header');

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const deployer = new DemoDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = DemoDeployer;