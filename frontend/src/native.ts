/**
 * Capacitor Native Bridge — initializes native plugins when running inside a Capacitor app.
 *
 * This module is a no-op in a regular browser environment.
 */
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

/** True when running inside the Capacitor native shell */
export const isNativePlatform = Capacitor.isNativePlatform();

/**
 * Call this once in your app entry-point (main.tsx) to set up native integrations.
 */
export async function initNativeBridge(): Promise<void> {
  if (!isNativePlatform) return;

  // ---------- Status Bar ----------
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    // Make content appear behind the status bar for immersive look
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Status bar plugin not available — ignore
  }

  // ---------- Keyboard ----------
  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('capacitor-keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('capacitor-keyboard-open');
    });
  } catch {
    // Keyboard plugin not available — ignore
  }

  // ---------- Android Back Button ----------
  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  } catch {
    // App plugin not available — ignore
  }

  // ---------- Splash Screen ----------
  try {
    // Hide splash after a short delay to let React render
    setTimeout(async () => {
      await SplashScreen.hide({ fadeOutDuration: 400 });
    }, 500);
  } catch {
    // Splash screen plugin not available — ignore
  }
}
