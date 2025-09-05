import { Component } from '@angular/core';
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
  template: `
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
  `,
  styles: [`
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
  `]
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
    return `
      <iframe 
        src="/showcase/video-output/tennis-club-rt2-demo.html" 
        width="100%" 
        height="100%" 
        frameborder="0"
        style="border: none; width: 100%; height: 100%;">
      </iframe>
    `;
  }
}