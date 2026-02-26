import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ThemeService } from './theme.service';
import { LanguageService } from './language.service';
import { GeminiService } from './gemini.service';
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
  private geminiService = inject(GeminiService);

  t = this.langService.t;
  uiStyles = this.langService.uiStyles;
  isGenerating = signal(false);
  generatedMarkdown = signal<string | null>(null);
  copySuccess = signal(false);
  error = signal<string | null>(null);

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

  async downloadPdf() {
    const md = this.generatedMarkdown();
    if (md) {
      try {
        // Dynamically import html2pdf to avoid SSR issues
        const html2pdf = (await import('html2pdf.js')).default;
        
        const htmlContent = await marked.parse(md);
        const isRtl = this.langService.lang() === 'fa';
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.padding = '20px';
        element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        element.style.lineHeight = '1.6';
        element.style.color = '#1f2937';
        element.dir = isRtl ? 'rtl' : 'ltr';
        
        // Add basic styles to the element for PDF rendering
        const styleEl = document.createElement('style');
        styleEl.textContent = `
          h1, h2, h3 { color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
          pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; word-wrap: break-word; }
          code { font-family: monospace; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
          pre code { background: transparent; padding: 0; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: ${isRtl ? 'right' : 'left'}; }
          th { background: #f9fafb; }
        `;
        element.appendChild(styleEl);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opt: any = {
          margin:       10,
          filename:     'AGENTS.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (html2pdf() as any).set(opt).from(element).save();
      } catch (err) {
        console.error('PDF generation error:', err);
        this.error.set(this.t().errorPdf);
      }
    }
  }
}
