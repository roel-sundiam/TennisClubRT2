const fs = require('fs-extra');
const path = require('path');

class EmbeddedDemoCreator {
  constructor() {
    this.outputDir = 'video-output';
  }

  async generateEmbeddedDemo() {
    console.log('📱 Creating Embedded Video Demo Component...');
    
    const embeddedComponent = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-video-demo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: \`
    <div class="demo-dialog-container">
      <div class="demo-header">
        <h2>🎾 Tennis Club RT2 - Video Demo</h2>
        <button mat-icon-button (click)="close()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="demo-content" [innerHTML]="demoContent"></div>
      
      <div class="demo-actions">
        <button mat-raised-button color="primary" (click)="openInNewTab()">
          <mat-icon>open_in_new</mat-icon>
          Open in New Tab
        </button>
        <button mat-button (click)="close()">Close</button>
      </div>
    </div>
  \`,
  styles: [\`
    .demo-dialog-container {
      width: 90vw;
      max-width: 1200px;
      height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .demo-header h2 {
      margin: 0;
      color: #1976d2;
    }
    
    .demo-content {
      flex: 1;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 1rem;
    }
    
    .demo-content ::ng-deep body {
      margin: 0;
      overflow: hidden;
    }
    
    .demo-actions {
      padding: 1rem;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }
  \`]
})
export class VideoDemoDialogComponent {
  demoContent: SafeHtml;
  
  constructor(
    private dialogRef: MatDialogRef<VideoDemoDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    this.demoContent = this.sanitizer.bypassSecurityTrustHtml(this.getDemoHtml());
  }
  
  close(): void {
    this.dialogRef.close();
  }
  
  openInNewTab(): void {
    const link = document.createElement('a');
    link.href = '/showcase/video-output/tennis-club-rt2-demo.html';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  private getDemoHtml(): string {
    return \`
      <iframe 
        src="/showcase/video-output/tennis-club-rt2-demo.html" 
        width="100%" 
        height="100%" 
        frameborder="0"
        style="border: none; width: 100%; height: 100%;">
      </iframe>
    \`;
  }
}`;

    const embeddedPath = path.join(this.outputDir, 'video-demo-dialog.component.ts');
    await fs.writeFile(embeddedPath, embeddedComponent);
    
    console.log('✅ Embedded demo component created: ' + path.basename(embeddedPath));
    
    // Also create usage instructions
    const usageInstructions = `# How to Use the Embedded Video Demo

## Option 1: Direct Link (Current Implementation)
The current implementation creates a direct link that bypasses Angular routing.

## Option 2: Embedded Dialog (Alternative)
If the direct link doesn't work, you can use the embedded dialog component:

### 1. Add the Dialog Component
Copy \`video-demo-dialog.component.ts\` to your components directory.

### 2. Update Admin Analytics Component
Add to imports:
\`\`\`typescript
import { MatDialog } from '@angular/material/dialog';
import { VideoDemoDialogComponent } from '../path/to/video-demo-dialog.component';
\`\`\`

Add to constructor:
\`\`\`typescript
constructor(
  // ... existing parameters
  private dialog: MatDialog
) {}
\`\`\`

Update the openVideoDemo method:
\`\`\`typescript
openVideoDemo(): void {
  const dialogRef = this.dialog.open(VideoDemoDialogComponent, {
    width: '90vw',
    height: '80vh',
    maxWidth: '1200px',
    disableClose: false
  });
  
  // Track the video demo view
  this.analyticsService.trackButtonClick('Video Demo', 'admin-analytics', { 
    action: 'view_demo_video',
    component: 'admin_analytics',
    timestamp: new Date().toISOString()
  });
}
\`\`\`

### 3. Add MatDialogModule
Make sure MatDialogModule is imported in your admin analytics component.

## Option 3: Route-Based (If needed)
Add a route in your app.routes.ts:
\`\`\`typescript
{ 
  path: 'video-demo', 
  loadComponent: () => import('./path/to/video-demo.component').then(m => m.VideoDemoComponent)
}
\`\`\`

Then navigate with:
\`\`\`typescript
this.router.navigate(['/video-demo']);
\`\`\`
`;

    const instructionsPath = path.join(this.outputDir, 'embedded-demo-instructions.md');
    await fs.writeFile(instructionsPath, usageInstructions);
    
    console.log('✅ Usage instructions created: ' + path.basename(instructionsPath));
    
    return { embeddedPath, instructionsPath };
  }

  async generate() {
    try {
      await fs.ensureDir(this.outputDir);
      const result = await this.generateEmbeddedDemo();
      
      console.log('\n🎉 Embedded Demo Components Created!');
      console.log('====================================');
      console.log('📁 Files created in: ' + this.outputDir + '/');
      console.log('   📄 video-demo-dialog.component.ts - Angular dialog component');  
      console.log('   📖 embedded-demo-instructions.md - Implementation guide');
      console.log('');
      console.log('🚀 Try the current direct link method first.');
      console.log('   If it does not work, use the embedded dialog option.');
      
      return result;
      
    } catch (error) {
      console.error('💥 Embedded demo creation failed: ' + error.message);
      return null;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new EmbeddedDemoCreator();
  creator.generate().catch(console.error);
}

module.exports = EmbeddedDemoCreator;