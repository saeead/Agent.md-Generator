import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'en' | 'fa';

export const UI_STYLES = [
  {
    id: 'none',
    repo: '',
  },
  {
    id: 'carbon',
    repo: 'https://github.com/carbon-design-system/carbon',
  },
  {
    id: 'ant-design-x',
    repo: 'https://github.com/ant-design/x',
  },
  {
    id: 'liquid-glass',
    repo: 'https://github.com/rdev/liquid-glass-react',
  },
  {
    id: 'stable-diffusion',
    repo: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
  },
  {
    id: 'selia',
    repo: 'https://github.com/nauvalazhar/selia',
  },
  {
    id: 'pro-max',
    repo: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
  },
  {
    id: 'linear-vercel',
    repo: '',
  },
  {
    id: 'neo-brutalism',
    repo: '',
  },
  {
    id: 'material-design',
    repo: '',
  },
  {
    id: 'apple-hig',
    repo: '',
  }
] as const;

export const TRANSLATIONS = {
  en: {
    title: 'AGENTS.md Generator',
    subtitle: 'Create professional AI coding guidelines for your project based on agents.md standard',
    promptContext: 'Prompt Context',
    advancedInputs: 'Advanced Inputs',
    projectName: 'Project Name',
    projectDescription: 'Project Description',
    techStack: 'Tech Stack',
    uiStyle: 'UI/UX Style',
    devEnvironmentTips: 'Dev Environment Tips',
    testingInstructions: 'Testing Instructions',
    prInstructions: 'PR Instructions',
    codingRules: 'Coding Conventions',
    usefulCommands: 'Useful Commands Recap',
    githubLinks: 'GitHub Repository Links (for context)',
    outputLanguage: 'Output Language',
    english: 'English',
    persian: 'Persian',
    fillEmptyFields: 'Use standard default data for empty fields',
    generateBtn: 'Generate AGENTS.md',
    generating: 'Generating...',
    preview: 'Preview',
    copy: 'Copy to Clipboard',
    copied: 'Copied!',
    download: 'Download .md',
    downloadHtml: 'Download HTML',
    downloadPdf: 'Download PDF',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    settings: 'Settings',
    apiKeyLabel: 'Personal Gemini API Key',
    apiKeyHint: 'Leave empty to use the default system key',
    displaySettings: 'Display Settings',
    fontSizeLabel: 'Font Size',
    uiDensityLabel: 'UI Density',
    lineNumbersLabel: 'Show Line Numbers',
    saveSettings: 'Save Settings',
    resetSettings: 'Reset to Defaults',
    verifyKey: 'Verify Key',
    verifying: 'Verifying...',
    keyValid: 'Key is valid and connected',
    keyInvalid: 'Invalid API Key or connection error',
    fontSizes: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large'
    },
    densities: {
      compact: 'Compact',
      comfortable: 'Comfortable',
      spacious: 'Spacious'
    },
    error: 'An error occurred while generating the file.',
    errorApiKey: 'Gemini API Key is missing. Please check your configuration.',
    errorQuota: 'API quota exceeded. Please try again later.',
    errorNetwork: 'Network error. Please check your internet connection.',
    errorUnknown: 'An unexpected error occurred. Please try again.',
    errorPdf: 'Failed to generate PDF. Please try HTML or Markdown export.',
    errorTimeout: 'Request timed out. Please try again.',
    placeholderName: 'e.g., My Awesome App',
    placeholderDesc: 'Briefly describe what your app does...',
    placeholderTech: 'React, Node.js, TailwindCSS...',
    placeholderDevEnv: 'e.g., Use pnpm run dev, do not run build inside agent session...',
    placeholderTesting: 'e.g., Run pnpm test before committing, fix all type errors...',
    placeholderPR: 'e.g., Title format: [Project] Title, always run lint...',
    placeholderRules: 'e.g., Use functional components, prefer interfaces over types...',
    placeholderCommands: 'e.g., npm run dev: Start dev server, npm run lint: Run ESLint...',
    placeholderGithub: 'https://github.com/user/repo',
    styles: {
      'none': 'No specific style',
      'carbon': 'Carbon Design System (Enterprise, Accessible)',
      'ant-design-x': 'Ant Design X (AI & Chat Interfaces)',
      'liquid-glass': 'Liquid Glass (Glassmorphism, Sleek)',
      'stable-diffusion': 'Stable Diffusion WebUI (Functional, Data-Dense)',
      'selia': 'Selia (Modern Admin Dashboard)',
      'pro-max': 'Pro Max UI/UX (High-End, Polished)',
      'linear-vercel': 'Linear / Vercel Style (Minimalist Dark, Developer-focused)',
      'neo-brutalism': 'Neo-Brutalism (Bold, High Contrast, Quirky)',
      'material-design': 'Material Design 3 (Google, Expressive)',
      'apple-hig': 'Apple HIG (Cupertino, Translucency, Depth)'
    }
  },
  fa: {
    title: 'سازنده AGENTS.md',
    subtitle: 'ایجاد راهنمای حرفه‌ای کدنویسی هوش مصنوعی بر اساس استاندارد agents.md',
    promptContext: 'کانتکست پرامپت',
    advancedInputs: 'فیلدهای پیشرفته',
    projectName: 'نام پروژه',
    projectDescription: 'توضیحات پروژه',
    techStack: 'تکنولوژی‌ها',
    uiStyle: 'سبک رابط کاربری (UI/UX)',
    devEnvironmentTips: 'نکات محیط توسعه',
    testingInstructions: 'دستورالعمل‌های تست',
    prInstructions: 'دستورالعمل‌های Pull Request',
    codingRules: 'قراردادهای کدنویسی',
    usefulCommands: 'خلاصه دستورات مفید',
    githubLinks: 'لینک‌های مخزن گیت‌هاب (برای زمینه)',
    outputLanguage: 'زبان خروجی فایل',
    english: 'انگلیسی',
    persian: 'فارسی',
    fillEmptyFields: 'استفاده از دیتای استاندارد پیش‌فرض برای فیلدهای خالی',
    generateBtn: 'تولید AGENTS.md',
    generating: 'در حال تولید...',
    preview: 'پیش‌نمایش',
    copy: 'کپی در حافظه',
    copied: 'کپی شد!',
    download: 'دانلود فایل',
    downloadHtml: 'دانلود HTML',
    downloadPdf: 'دانلود PDF',
    lightMode: 'حالت روشن',
    darkMode: 'حالت تاریک',
    language: 'زبان',
    settings: 'تنظیمات',
    apiKeyLabel: 'کلید API شخصی گمینی',
    apiKeyHint: 'برای استفاده از کلید پیش‌فرض سیستم، این فیلد را خالی بگذارید',
    displaySettings: 'تنظیمات نمایش',
    fontSizeLabel: 'اندازه فونت',
    uiDensityLabel: 'تراکم رابط کاربری',
    lineNumbersLabel: 'نمایش شماره خطوط',
    saveSettings: 'ذخیره تنظیمات',
    resetSettings: 'تنظیمات پیش‌فرض',
    verifyKey: 'بررسی اعتبار',
    verifying: 'در حال بررسی...',
    keyValid: 'کلید معتبر و متصل است',
    keyInvalid: 'کلید نامعتبر یا خطای اتصال',
    fontSizes: {
      small: 'کوچک',
      medium: 'متوسط',
      large: 'بزرگ'
    },
    densities: {
      compact: 'فشرده',
      comfortable: 'معمولی',
      spacious: 'وسیع'
    },
    error: 'خطایی در تولید فایل رخ داد.',
    errorApiKey: 'کلید API گمینی یافت نشد. لطفا تنظیمات خود را بررسی کنید.',
    errorQuota: 'سهمیه استفاده از API به پایان رسیده است. لطفا بعدا تلاش کنید.',
    errorNetwork: 'خطای شبکه. لطفا اتصال اینترنت خود را بررسی کنید.',
    errorUnknown: 'یک خطای غیرمنتظره رخ داد. لطفا دوباره تلاش کنید.',
    errorPdf: 'خطا در تولید PDF. لطفا از خروجی HTML یا Markdown استفاده کنید.',
    errorTimeout: 'زمان درخواست به پایان رسید. لطفا دوباره تلاش کنید.',
    placeholderName: 'مثال: اپلیکیشن فوق‌العاده من',
    placeholderDesc: 'به اختصار توضیح دهید اپلیکیشن شما چه کاری انجام می‌دهد...',
    placeholderTech: 'React, Node.js, TailwindCSS...',
    placeholderDevEnv: 'مثال: از pnpm run dev استفاده کنید، دستور build را در نشست ایجنت اجرا نکنید...',
    placeholderTesting: 'مثال: قبل از کامیت pnpm test را اجرا کنید، تمام خطاهای تایپ را رفع کنید...',
    placeholderPR: 'مثال: فرمت عنوان: [Project] Title، همیشه lint را اجرا کنید...',
    placeholderRules: 'مثال: استفاده از کامپوننت‌های تابعی، ترجیح interface بر type...',
    placeholderCommands: 'مثال: npm run dev: اجرای سرور توسعه، npm run lint: اجرای ESLint...',
    placeholderGithub: 'https://github.com/user/repo',
    styles: {
      'none': 'بدون سبک خاص',
      'carbon': 'سیستم طراحی Carbon (سازمانی، دسترس‌پذیر)',
      'ant-design-x': 'Ant Design X (رابط‌های کاربری هوش مصنوعی و چت)',
      'liquid-glass': 'Liquid Glass (گلس‌مورفیسم، براق و مدرن)',
      'stable-diffusion': 'Stable Diffusion WebUI (عملکردی، متراکم از داده)',
      'selia': 'Selia (داشبورد ادمین مدرن)',
      'pro-max': 'Pro Max UI/UX (حرفه‌ای، صیقل‌خورده و لوکس)',
      'linear-vercel': 'سبک Linear / Vercel (تاریک مینیمال، متمرکز بر توسعه‌دهنده)',
      'neo-brutalism': 'نئو-بروتالیسم (جسورانه، کنتراست بالا، حاشیه‌های ضخیم)',
      'material-design': 'Material Design 3 (گوگل، پویا و منعطف)',
      'apple-hig': 'Apple HIG (سبک اپل، شفافیت، عمق)'
    }
  }
} as const;

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  lang = signal<Language>('fa');
  private platformId = inject(PLATFORM_ID);

  t = computed(() => TRANSLATIONS[this.lang()]);
  uiStyles = UI_STYLES;

  constructor() {
    this.initLang();
  }

  private initLang() {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('lang') as Language | null;
      if (savedLang) {
        this.setLang(savedLang);
      } else {
        this.setLang('fa');
      }
    } else {
      this.setLang('fa');
    }
  }

  toggleLang() {
    this.setLang(this.lang() === 'en' ? 'fa' : 'en');
  }

  private setLang(newLang: Language) {
    this.lang.set(newLang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', newLang);
      document.documentElement.dir = newLang === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }
  }
}
