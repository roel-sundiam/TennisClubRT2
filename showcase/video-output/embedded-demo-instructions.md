# How to Use the Embedded Video Demo

## Option 1: Direct Link (Current Implementation)
The current implementation creates a direct link that bypasses Angular routing.

## Option 2: Embedded Dialog (Alternative)
If the direct link doesn't work, you can use the embedded dialog component:

### 1. Add the Dialog Component
Copy `video-demo-dialog.component.ts` to your components directory.

### 2. Update Admin Analytics Component
Add to imports:
```typescript
import { MatDialog } from '@angular/material/dialog';
import { VideoDemoDialogComponent } from '../path/to/video-demo-dialog.component';
```

Add to constructor:
```typescript
constructor(
  // ... existing parameters
  private dialog: MatDialog
) {}
```

Update the openVideoDemo method:
```typescript
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
```

### 3. Add MatDialogModule
Make sure MatDialogModule is imported in your admin analytics component.

## Option 3: Route-Based (If needed)
Add a route in your app.routes.ts:
```typescript
{ 
  path: 'video-demo', 
  loadComponent: () => import('./path/to/video-demo.component').then(m => m.VideoDemoComponent)
}
```

Then navigate with:
```typescript
this.router.navigate(['/video-demo']);
```
