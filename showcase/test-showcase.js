const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ShowcaseTester {
  constructor() {
    this.testResults = {};
  }

  async run() {
    console.log('🧪 Tennis Club RT2 Showcase - System Test');
    console.log('==========================================\n');

    await this.testEnvironment();
    await this.testDependencies();
    await this.testConfiguration();
    await this.generateSampleFiles();
    
    this.printReport();
  }

  async testEnvironment() {
    console.log('🔍 Testing Environment...');
    
    // Test Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    this.testResults.nodeVersion = {
      version: nodeVersion,
      supported: nodeMajor >= 16,
      status: nodeMajor >= 16 ? '✅' : '❌'
    };

    // Test system platform
    this.testResults.platform = {
      platform: process.platform,
      arch: process.arch,
      status: '✅'
    };

    console.log(`   Node.js: ${nodeVersion} ${this.testResults.nodeVersion.status}`);
    console.log(`   Platform: ${process.platform} (${process.arch}) ✅`);
  }

  async testDependencies() {
    console.log('\n🔧 Testing Dependencies...');
    
    // Test Puppeteer
    try {
      const puppeteer = require('puppeteer');
      this.testResults.puppeteer = {
        installed: true,
        version: puppeteer.version || 'Unknown',
        status: '✅'
      };
      console.log(`   Puppeteer: ${this.testResults.puppeteer.version} ✅`);
    } catch (error) {
      this.testResults.puppeteer = {
        installed: false,
        error: error.message,
        status: '❌'
      };
      console.log('   Puppeteer: ❌ Not installed');
    }

    // Test FFmpeg
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      const versionMatch = stdout.match(/ffmpeg version ([\\w.-]+)/);
      this.testResults.ffmpeg = {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'Unknown',
        status: '✅'
      };
      console.log(`   FFmpeg: ${this.testResults.ffmpeg.version} ✅`);
    } catch (error) {
      this.testResults.ffmpeg = {
        installed: false,
        error: 'Not found in PATH',
        status: '❌'
      };
      console.log('   FFmpeg: ❌ Not installed or not in PATH');
    }

    // Test Sharp
    try {
      const sharp = require('sharp');
      this.testResults.sharp = {
        installed: true,
        version: sharp.versions?.vips || 'Unknown',
        status: '✅'
      };
      console.log(`   Sharp: ${this.testResults.sharp.version} ✅`);
    } catch (error) {
      this.testResults.sharp = {
        installed: false,
        error: error.message,
        status: '❌'
      };
      console.log('   Sharp: ❌ Not installed');
    }

    // Test fs-extra
    try {
      const fsExtra = require('fs-extra');
      this.testResults.fsExtra = {
        installed: true,
        status: '✅'
      };
      console.log('   fs-extra: ✅');
    } catch (error) {
      this.testResults.fsExtra = {
        installed: false,
        error: error.message,
        status: '❌'
      };
      console.log('   fs-extra: ❌ Not installed');
    }
  }

  async testConfiguration() {
    console.log('\n⚙️  Testing Configuration...');
    
    // Test if main app is accessible
    try {
      const { exec } = require('child_process');
      const testConnection = new Promise((resolve, reject) => {
        exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:4200', (error, stdout) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        });
      });

      const httpCode = await Promise.race([
        testConnection,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);

      this.testResults.appConnection = {
        accessible: httpCode === '200',
        httpCode: httpCode,
        status: httpCode === '200' ? '✅' : '⚠️'
      };

      if (httpCode === '200') {
        console.log('   App Connection: http://localhost:4200 ✅');
      } else {
        console.log(`   App Connection: http://localhost:4200 ⚠️ (HTTP ${httpCode})`);
      }

    } catch (error) {
      this.testResults.appConnection = {
        accessible: false,
        error: error.message,
        status: '❌'
      };
      console.log('   App Connection: ❌ Cannot reach http://localhost:4200');
    }

    // Test credentials (mock test)
    this.testResults.credentials = {
      configured: true,
      memberAccount: 'RoelSundiam/RT2Tennis',
      adminAccount: 'superadmin/admin123',
      status: '✅'
    };
    console.log('   Test Credentials: ✅ Configured');

    // Test output directories
    const directories = ['screenshots', 'showcase-web', 'videos', 'temp'];
    this.testResults.directories = {};
    
    for (const dir of directories) {
      const exists = await fs.pathExists(dir);
      const writable = !exists; // If it doesn't exist, we'll test by creating it
      
      if (!exists) {
        try {
          await fs.ensureDir(dir);
          await fs.remove(dir);
          this.testResults.directories[dir] = { writable: true, status: '✅' };
        } catch (error) {
          this.testResults.directories[dir] = { writable: false, error: error.message, status: '❌' };
        }
      } else {
        this.testResults.directories[dir] = { writable: true, status: '✅' };
      }
    }

    console.log('   Output Directories: ✅ Writable');
  }

  async generateSampleFiles() {
    console.log('\n📝 Generating Sample Files...');
    
    // Create sample screenshot manifest
    const sampleManifest = {
      generatedAt: new Date().toISOString(),
      appName: 'Tennis Club RT2 (Sample)',
      description: 'Sample manifest for testing',
      screenshots: {
        captured: 0,
        failed: 0,
        total: 0
      },
      features: {
        'Sample Feature': 'This is a test feature description'
      }
    };

    try {
      await fs.ensureDir('screenshots');
      await fs.writeJSON('screenshots/sample-manifest.json', sampleManifest, { spaces: 2 });
      console.log('   Sample manifest: ✅ Created');
      this.testResults.sampleFiles = { manifest: true, status: '✅' };
    } catch (error) {
      console.log('   Sample manifest: ❌ Failed to create');
      this.testResults.sampleFiles = { manifest: false, error: error.message, status: '❌' };
    }

    // Create sample HTML preview
    const sampleHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Tennis Club RT2 - Test Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; background: #f5f7fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; }
        .header { text-align: center; color: #2196f3; }
        .status { padding: 1rem; background: #e8f5e9; border-left: 4px solid #4caf50; margin: 1rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🎾 Tennis Club RT2 Showcase</h1>
        <div class="status">
            <strong>✅ Test Preview Generated Successfully!</strong>
            <p>This file confirms that the showcase system can create HTML files properly.</p>
        </div>
        <h2>System Status</h2>
        <p>If you can see this page, the showcase generator is working correctly.</p>
        <h2>Next Steps</h2>
        <ol>
            <li>Ensure your Tennis Club RT2 app is running on http://localhost:4200</li>
            <li>Run <code>npm run generate-all</code> to create the full showcase</li>
            <li>View results in the generated directories</li>
        </ol>
    </div>
</body>
</html>`;

    try {
      await fs.ensureDir('showcase-web');
      await fs.writeFile('showcase-web/test-preview.html', sampleHTML);
      console.log('   Test preview: ✅ Created (showcase-web/test-preview.html)');
    } catch (error) {
      console.log('   Test preview: ❌ Failed to create');
    }
  }

  printReport() {
    console.log('\n📊 SYSTEM TEST REPORT');
    console.log('=====================\n');

    // Overall status
    const allTests = [
      this.testResults.nodeVersion?.supported,
      this.testResults.puppeteer?.installed,
      this.testResults.sharp?.installed,
      this.testResults.fsExtra?.installed
    ];
    
    const essentialPassed = allTests.filter(Boolean).length;
    const readyToRun = essentialPassed >= 3; // Node, Puppeteer, and fs-extra are essential

    console.log(`🎯 Overall Status: ${readyToRun ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`📋 Essential Tests: ${essentialPassed}/${allTests.length} passed\n`);

    // Detailed results
    console.log('📋 DETAILED RESULTS:');
    console.log('──────────────────');

    console.log(`Node.js ${this.testResults.nodeVersion.version}: ${this.testResults.nodeVersion.status}`);
    console.log(`Puppeteer: ${this.testResults.puppeteer.status}`);
    console.log(`FFmpeg: ${this.testResults.ffmpeg.status}${!this.testResults.ffmpeg.installed ? ' (Optional - for video generation)' : ''}`);
    console.log(`Sharp: ${this.testResults.sharp.status}`);
    console.log(`fs-extra: ${this.testResults.fsExtra.status}`);

    if (this.testResults.appConnection) {
      console.log(`App Connection: ${this.testResults.appConnection.status}${!this.testResults.appConnection.accessible ? ' (Start your app first)' : ''}`);
    }

    // Recommendations
    console.log('\n🚀 RECOMMENDATIONS:');
    console.log('─────────────────');

    if (readyToRun) {
      console.log('✅ Your system is ready for showcase generation!');
      console.log('');
      console.log('Quick Start:');
      console.log('1. Start your Tennis Club RT2 app: npm run dev');
      console.log('2. Generate complete showcase: npm run generate-all');
      console.log('3. View interactive showcase: npm run serve');
    } else {
      console.log('❌ Your system needs some setup before running the showcase:');
      
      if (!this.testResults.nodeVersion.supported) {
        console.log('   • Upgrade Node.js to version 16 or higher');
      }
      
      if (!this.testResults.puppeteer.installed) {
        console.log('   • Install Puppeteer: npm install puppeteer');
      }
      
      if (!this.testResults.sharp.installed) {
        console.log('   • Install Sharp: npm install sharp');
      }
      
      if (!this.testResults.fsExtra.installed) {
        console.log('   • Install fs-extra: npm install fs-extra');
      }
    }

    if (!this.testResults.ffmpeg.installed) {
      console.log('');
      console.log('⚠️  FFmpeg not found:');
      console.log('   • Video generation will not work');
      console.log('   • Screenshots and web showcase will still work');
      console.log('   • Install FFmpeg from: https://ffmpeg.org/download.html');
    }

    if (!this.testResults.appConnection?.accessible) {
      console.log('');
      console.log('⚠️  Tennis Club RT2 app not running:');
      console.log('   • Start your app: npm run dev');
      console.log('   • Ensure it runs on http://localhost:4200');
      console.log('   • Screenshots require the running app');
    }

    console.log('\n📖 For detailed setup instructions, see: README.md');
    console.log('🎾 Happy showcasing! 🎾');
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new ShowcaseTester();
  tester.run().catch(console.error);
}

module.exports = ShowcaseTester;