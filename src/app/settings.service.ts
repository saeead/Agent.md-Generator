import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type FontSize = 'small' | 'medium' | 'large';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private platformId = inject(PLATFORM_ID);

  userApiKey = signal<string>('');
  fontSize = signal<FontSize>('medium');
  uiDensity = signal<UiDensity>('comfortable');
  showLineNumbers = signal<boolean>(true);

  constructor() {
    this.initSettings();
  }

  private initSettings() {
    if (isPlatformBrowser(this.platformId)) {
      this.userApiKey.set(localStorage.getItem('user_api_key') || '');
      this.fontSize.set((localStorage.getItem('font_size') as FontSize) || 'medium');
      this.uiDensity.set((localStorage.getItem('ui_density') as UiDensity) || 'comfortable');
      this.showLineNumbers.set(localStorage.getItem('show_line_numbers') !== 'false');
    }
  }

  setApiKey(key: string) {
    this.userApiKey.set(key);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user_api_key', key);
    }
  }

  setFontSize(size: FontSize) {
    this.fontSize.set(size);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('font_size', size);
    }
  }

  setDensity(density: UiDensity) {
    this.uiDensity.set(density);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('ui_density', density);
    }
  }

  toggleLineNumbers() {
    const newValue = !this.showLineNumbers();
    this.showLineNumbers.set(newValue);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('show_line_numbers', String(newValue));
    }
  }

  getEffectiveApiKey(envKey: string): string {
    return this.userApiKey() || envKey;
  }

  reset() {
    this.userApiKey.set('');
    this.fontSize.set('medium');
    this.uiDensity.set('comfortable');
    this.showLineNumbers.set(true);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user_api_key');
      localStorage.removeItem('font_size');
      localStorage.removeItem('ui_density');
      localStorage.removeItem('show_line_numbers');
    }
  }
}
