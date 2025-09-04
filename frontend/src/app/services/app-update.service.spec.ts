import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  let service: AppUpdateService;
  let mockSwUpdate: jasmine.SpyObj<SwUpdate>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    const swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['checkForUpdate', 'activateUpdate'], {
      versionUpdates: {
        subscribe: jasmine.createSpy('subscribe')
      }
    });
    
    Object.defineProperty(swUpdateSpy, 'isEnabled', {
      get: () => true,
      configurable: true
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        { provide: SwUpdate, useValue: swUpdateSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    service = TestBed.inject(AppUpdateService);
    mockSwUpdate = TestBed.inject(SwUpdate) as jasmine.SpyObj<SwUpdate>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize when service worker is enabled', () => {
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));
    
    service.init();
    
    expect(mockSwUpdate.versionUpdates.subscribe).toHaveBeenCalled();
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('should not initialize when service worker is disabled', () => {
    // Reconfigure the mock to return false for isEnabled
    Object.defineProperty(mockSwUpdate, 'isEnabled', {
      get: () => false,
      configurable: true
    });
    
    spyOn(console, 'log');
    service.init();
    
    expect(console.log).toHaveBeenCalledWith('🔄 Service Worker not enabled - updates disabled');
  });

  it('should return correct update status', () => {
    const status = service.getUpdateStatus();
    
    expect(status.enabled).toBe(true);
    expect(status.available).toBe(false);
  });

  it('should handle force update check when service worker is disabled', () => {
    // Reconfigure the mock to return false for isEnabled
    Object.defineProperty(mockSwUpdate, 'isEnabled', {
      get: () => false,
      configurable: true
    });
    mockSnackBar.open.and.returnValue({ dismiss: () => {} } as any);
    
    service.forceUpdateCheck();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      '❌ Updates not available in this environment',
      'OK',
      jasmine.any(Object)
    );
  });

  it('should handle force update check when service worker is enabled', () => {
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));
    mockSnackBar.open.and.returnValue({ dismiss: () => {} } as any);
    
    service.forceUpdateCheck();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      '⏳ Checking for updates...',
      '',
      jasmine.any(Object)
    );
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
  });
});