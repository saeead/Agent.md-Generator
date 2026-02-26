import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ThemeService } from './theme.service';
import { LanguageService } from './language.service';
import { GeminiService } from './gemini.service';
import { SettingsService } from './settings.service';
import { MatIconModule } from '@angular/material/icon';
import { marked } from 'marked';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private fb = inject(FormBuilder);
  themeService = inject(ThemeService);
  langService = inject(LanguageService);
  settingsService = inject(SettingsService);
  private geminiService = inject(GeminiService);

  constructor() {
    this.settingsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((val) => {
      if (val.userApiKey !== undefined) {
        this.settingsService.setApiKey((val.userApiKey || '').trim());
      }
      if (val.fontSize) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.settingsService.setFontSize(val.fontSize as any);
      }
      if (val.uiDensity) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.settingsService.setDensity(val.uiDensity as any);
      }
      if (val.showLineNumbers !== undefined) {
        this.settingsService.setShowLineNumbers(!!val.showLineNumbers);
      }
    });
  }

  t = this.langService.t;
  uiStyles = this.langService.uiStyles;
  isGenerating = signal(false);
  generatedMarkdown = signal<string | null>(null);
  previewMarkdown = computed(() => {
    const markdown = this.generatedMarkdown();
    if (!markdown) return '';

    if (!this.settingsService.showLineNumbers()) {
      return markdown;
    }

    const lines = markdown.split('\n');
    const width = String(lines.length).length;
    return lines
      .map((line, index) => `${String(index + 1).padStart(width, ' ')} | ${line}`)
      .join('\n');
  });

  copySuccess = signal(false);
  error = signal<string | null>(null);
  showSettings = signal(false);
  isValidatingApiKey = signal(false);
  apiKeyStatus = signal<'idle' | 'valid' | 'invalid'>('idle');
  showApiKeyRequiredDialog = signal(false);
  showApiKeyGuideDialog = signal(false);

  settingsForm = this.fb.group({
    userApiKey: [this.settingsService.userApiKey()],
    fontSize: [this.settingsService.fontSize()],
    uiDensity: [this.settingsService.uiDensity()],
    showLineNumbers: [this.settingsService.showLineNumbers()],
  });

  agentForm = this.fb.group({
    projectName: ['', Validators.required],
    projectDescription: ['', Validators.required],
    techStack: ['', Validators.required],
    uiStyle: ['none'],
    outputLanguage: ['en'],
    fillEmptyFields: [false],
    devEnvironmentTips: [''],
    testingInstructions: [''],
    prInstructions: [''],
    codingRules: [''],
    usefulCommands: [''],
    githubLinks: [''],
  });

  async onSubmit() {
    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    if (!this.settingsService.userApiKey().trim()) {
      this.showApiKeyRequiredDialog.set(true);
      return;
    }

    this.isGenerating.set(true);
    this.error.set(null);
    this.generatedMarkdown.set(null);

    try {
      const formValue = this.agentForm.getRawValue();
      
      // Get the full style name and repo link
      const selectedStyleId = formValue.uiStyle;
      const styleObj = this.uiStyles.find(s => s.id === selectedStyleId);
      
      // Type assertion to bypass strict indexing issues
      const stylesObj = this.t().styles as Record<string, string>;
      const styleName = stylesObj[selectedStyleId || 'none'];
      
      const data = {
        ...formValue,
        uiStyle: selectedStyleId === 'none' ? 'None' : `${styleName}${styleObj?.repo ? ` (Reference: ${styleObj.repo})` : ''}`
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = await this.geminiService.generateAgentMd(data as any);
      this.generatedMarkdown.set(markdown);
    } catch (error) {
      const errorKey = (error as Error).message;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = this.t() as any;
      
      switch (errorKey) {
        case 'API_KEY_MISSING':
          this.error.set(t.errorApiKey);
          break;
        case 'QUOTA_EXCEEDED':
          this.error.set(t.errorQuota);
          break;
        case 'NETWORK_ERROR':
          this.error.set(t.errorNetwork);
          break;
        case 'TIMEOUT':
          this.error.set(t.errorTimeout);
          break;
        default:
          this.error.set(t.errorUnknown || t.error);
      }
    } finally {
      this.isGenerating.set(false);
    }
  }

  toggleSettings() {
    this.showSettings.set(!this.showSettings());
    if (this.showSettings()) {
      this.apiKeyStatus.set('idle');
      this.settingsForm.patchValue({
        userApiKey: this.settingsService.userApiKey(),
        fontSize: this.settingsService.fontSize(),
        uiDensity: this.settingsService.uiDensity(),
        showLineNumbers: this.settingsService.showLineNumbers(),
      });
    }
  }

  openSettingsForApiKey() {
    this.showApiKeyRequiredDialog.set(false);
    if (!this.showSettings()) {
      this.toggleSettings();
    }
  }

  openApiKeyGuide() {
    this.showApiKeyGuideDialog.set(true);
  }

  closeApiKeyGuide() {
    this.showApiKeyGuideDialog.set(false);
  }

  closeApiKeyRequiredDialog() {
    this.showApiKeyRequiredDialog.set(false);
  }

  async validateApiKey() {
    const key = this.settingsForm.get('userApiKey')?.value;
    if (!key) return;

    this.isValidatingApiKey.set(true);
    this.apiKeyStatus.set('idle');

    try {
      const isValid = await this.geminiService.validateApiKey(key);
      this.apiKeyStatus.set(isValid ? 'valid' : 'invalid');
    } catch {
      this.apiKeyStatus.set('invalid');
    } finally {
      this.isValidatingApiKey.set(false);
    }
  }

  saveSettings() {
    this.showSettings.set(false);
  }

  resetSettings() {
    this.settingsService.reset();
    this.settingsForm.patchValue({
      userApiKey: '',
      fontSize: 'medium',
      uiDensity: 'comfortable',
      showLineNumbers: true,
    });
  }

  async copyToClipboard() {
    const md = this.generatedMarkdown();
    if (md) {
      try {
        await navigator.clipboard.writeText(md);
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }

  downloadMarkdown() {
    const md = this.generatedMarkdown();
    if (md) {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AGENTS.md';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  async downloadHtml() {
    const md = this.generatedMarkdown();
    if (md) {
      const htmlContent = await marked.parse(md);
      const isRtl = this.langService.lang() === 'fa';
      const fullHtml = `<!DOCTYPE html>
<html lang="${this.langService.lang()}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>AGENTS.md</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 2rem; 
      color: #1f2937;
    }
    h1, h2, h3 { color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
    pre code { background: transparent; padding: 0; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote { border-left: 4px solid #e5e7eb; margin-left: 0; padding-left: 1rem; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
    th { background: #f9fafb; }
    [dir="rtl"] th, [dir="rtl"] td { text-align: right; }
    [dir="rtl"] blockquote { border-left: none; border-right: 4px solid #e5e7eb; margin-left: auto; margin-right: 0; padding-left: 0; padding-right: 1rem; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AGENTS.html';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

}
