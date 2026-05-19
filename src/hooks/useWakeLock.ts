import { useEffect } from 'react';
import { Platform } from 'react-native';

// Keeps the screen awake on iOS Safari/PWA where the Wake Lock API isn't supported.
// Uses a looping silent video trick as a fallback.
export function useWakeLock() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let wakeLock: any = null;
    let video: HTMLVideoElement | null = null;

    async function acquire() {
      // Try standard Wake Lock API first (works on Chrome, Android)
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          return;
        } catch {
          // Fall through to video fallback
        }
      }

      // iOS Safari/PWA fallback: play a tiny silent video on loop
      video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('loop', '');
      video.style.position = 'fixed';
      video.style.top = '-1px';
      video.style.left = '-1px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.01';

      // Minimal silent MP4 (base64 encoded)
      video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAA1m1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU4Ljc2LjEwMA==';
      video.muted = true;

      document.body.appendChild(video);
      try {
        await video.play();
      } catch {
        // Autoplay blocked — will still help in some cases
      }
    }

    acquire();

    // Re-acquire wake lock when page becomes visible again
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        acquire();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      if (video) {
        video.pause();
        video.remove();
      }
    };
  }, []);
}
