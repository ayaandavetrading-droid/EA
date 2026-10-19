/**
 * Apex Gold AI — Universal Screen Capture & Device Supervision Engine
 * Supports:
 * 1. WebRTC navigator.mediaDevices.getDisplayMedia (Desktop & Android Chrome PWA/WebAPK)
 * 2. Native Android MediaProjection Bridge (via window.ApexAndroidBridge / Capacitor)
 * 3. Graceful fallback with direct MT5 Desktop/VPS autonomous engine connection
 */

export interface ScreenCaptureState {
  isSupported: boolean;
  isActive: boolean;
  isNativeAndroid: boolean;
  isPWA: boolean;
  isMobile: boolean;
  stream: MediaStream | null;
  errorType: 'NONE' | 'PERMISSION_DENIED' | 'UNSUPPORTED_BROWSER' | 'STREAM_ENDED' | 'UNKNOWN';
  errorMessage: string | null;
}

export type ScreenCaptureCallback = (state: ScreenCaptureState) => void;

declare global {
  interface Window {
    ApexAndroidBridge?: {
      startScreenCapture: () => void;
      stopScreenCapture: () => void;
      isAvailable: () => boolean;
      onFrameCaptured?: (base64Image: string) => void;
    };
  }
}

export class ScreenCaptureService {
  private currentStream: MediaStream | null = null;
  private state: ScreenCaptureState;
  private listeners: Set<ScreenCaptureCallback> = new Set();

  constructor() {
    const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    const isPWA = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
    const isNativeAndroid = typeof window !== 'undefined' && !!window.ApexAndroidBridge;
    const isSupported = typeof navigator !== 'undefined' && !!(
      navigator.mediaDevices?.getDisplayMedia ||
      (navigator as any).getDisplayMedia ||
      isNativeAndroid
    );

    this.state = {
      isSupported,
      isActive: false,
      isNativeAndroid,
      isPWA,
      isMobile,
      stream: null,
      errorType: 'NONE',
      errorMessage: null,
    };
  }

  public getState(): ScreenCaptureState {
    return { ...this.state };
  }

  public subscribe(callback: ScreenCaptureCallback): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(currentState);
      } catch (err) {
        console.warn('Listener error in ScreenCaptureService:', err);
      }
    });
  }

  /**
   * Primary method to initiate screen capture upon direct user gesture
   */
  public async startCapture(): Promise<{ success: boolean; stream?: MediaStream; message?: string }> {
    // 1. If native Android bridge is available (installed APK)
    if (this.state.isNativeAndroid && window.ApexAndroidBridge) {
      try {
        window.ApexAndroidBridge.startScreenCapture();
        this.state.isActive = true;
        this.state.errorType = 'NONE';
        this.state.errorMessage = null;
        this.notify();
        return { success: true, message: 'Native Android MediaProjection initiated.' };
      } catch (err: any) {
        const errorText = err?.message || 'Native Android capture failed.';
        this.state.errorType = 'UNKNOWN';
        this.state.errorMessage = errorText;
        this.notify();
        return { success: false, message: errorText };
      }
    }

    // 2. Standard WebRTC Screen Capture via navigator.mediaDevices.getDisplayMedia
    const getDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices) ||
      (navigator as any).getDisplayMedia?.bind(navigator);

    if (!getDisplayMedia) {
      const msg = this.state.isMobile
        ? 'Standard mobile browser sandbox restricts direct cross-app screen capture. Install the Android PWA/APK or use the direct MT5 VPS engine.'
        : 'Display media capture API is not available in this browser window.';
      
      this.state.errorType = 'UNSUPPORTED_BROWSER';
      this.state.errorMessage = msg;
      this.notify();
      return { success: false, message: msg };
    }

    try {
      // Direct call within user gesture context
      const stream: MediaStream = await getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      });

      this.currentStream = stream;
      this.state.stream = stream;
      this.state.isActive = true;
      this.state.errorType = 'NONE';
      this.state.errorMessage = null;

      // Handle user ending the stream via OS / browser native control bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.handleStreamEnded();
        };
      }

      // Store preference: User authorized screen sharing
      try {
        localStorage.setItem('apex_screen_share_authorized', 'true');
        localStorage.setItem('apex_last_screen_share_time', Date.now().toString());
      } catch (_) {}

      this.notify();
      return { success: true, stream };
    } catch (err: any) {
      console.warn('Screen capture prompt response:', err);

      let errorType: ScreenCaptureState['errorType'] = 'UNKNOWN';
      let errorMessage = err?.message || 'Screen capture was not started.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'PERMISSION_DENIED';
        errorMessage = 'Screen capture permission was cancelled or denied by user.';
      } else if (err.name === 'NotSupportedError') {
        errorType = 'UNSUPPORTED_BROWSER';
        errorMessage = 'Screen sharing is not supported by this browser version or context.';
      } else if (err.name === 'AbortError') {
        errorType = 'STREAM_ENDED';
        errorMessage = 'Screen share selection was aborted.';
      }

      this.state.errorType = errorType;
      this.state.errorMessage = errorMessage;
      this.state.isActive = false;
      this.state.stream = null;
      this.notify();

      return { success: false, message: errorMessage };
    }
  }

  public stopCapture(): void {
    if (this.currentStream) {
      try {
        this.currentStream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Error stopping media tracks:', err);
      }
      this.currentStream = null;
    }

    if (this.state.isNativeAndroid && window.ApexAndroidBridge) {
      try {
        window.ApexAndroidBridge.stopScreenCapture();
      } catch (_) {}
    }

    this.state.isActive = false;
    this.state.stream = null;
    this.notify();
  }

  private handleStreamEnded(): void {
    this.stopCapture();
    this.state.errorType = 'STREAM_ENDED';
    this.state.errorMessage = 'Screen sharing session ended by user or system.';
    this.notify();
  }
}

// Export singleton instance
export const screenCaptureService = new ScreenCaptureService();
