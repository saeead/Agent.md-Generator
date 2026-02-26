import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private settingsService = inject(SettingsService);
  private ai: GoogleGenAI | null = null;
  private currentApiKey = '';

  private getAiInstance(customKey?: string): GoogleGenAI {
    const envKey = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
    const effectiveKey = customKey !== undefined ? customKey : this.settingsService.getEffectiveApiKey(envKey);

    if (!this.ai || this.currentApiKey !== effectiveKey) {
      this.currentApiKey = effectiveKey;
      this.ai = new GoogleGenAI({ apiKey: effectiveKey });
    }
    return this.ai;
  }

  async validateApiKey(key: string): Promise<boolean> {
    if (!key) return false;
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // Use a very simple and cheap call to validate the key
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'hi',
        config: { maxOutputTokens: 1 }
      });
      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }

  async generateAgentMd(data: {
    projectName: string;
    projectDescription: string;
    techStack: string;
    uiStyle: string;
    devEnvironmentTips: string;
    testingInstructions: string;
    prInstructions: string;
    codingRules: string;
    usefulCommands: string;
    githubLinks: string;
    outputLanguage: 'en' | 'fa';
    fillEmptyFields: boolean;
  }): Promise<string> {
    const prompt = `
You are an expert software architect and AI coding assistant.
Your task is to generate a professional, comprehensive AGENTS.md file for a software project based on the official agents.md standard.
This file will be used as the primary instruction manual for an AI coding agent (like yourself) working on this project.

The output MUST be in Markdown format.
The language of the generated AGENTS.md MUST be ${data.outputLanguage === 'fa' ? 'Persian (Farsi)' : 'English'}.

Here are the project details provided by the user:
- Project Name: ${data.projectName}
- Project Description: ${data.projectDescription}
- Tech Stack: ${data.techStack}
- UI/UX Style Preference: ${data.uiStyle}
- Dev Environment Tips: ${data.devEnvironmentTips}
- Testing Instructions: ${data.testingInstructions}
- PR Instructions: ${data.prInstructions}
- Coding Conventions: ${data.codingRules}
- Useful Commands: ${data.usefulCommands}
- Reference GitHub Links: ${data.githubLinks}

${data.fillEmptyFields ? `
IMPORTANT INSTRUCTION: The user has requested to "Use standard default data for empty fields". 
If any of the optional fields above (Dev Environment Tips, Testing Instructions, PR Instructions, Coding Conventions, Useful Commands, GitHub Links) are empty or missing, you MUST generate standard, best-practice content for them based on the provided Tech Stack and Project Description. Do not leave those sections empty in the final output.
` : ''}

Structure the AGENTS.md file professionally with the following sections based on the agents.md standard:
1. **Title**: # AGENTS Guidelines for [Project Name]
2. **Introduction**: A brief summary of the project and the purpose of this file.
3. **UI/UX Guidelines**: Specific instructions for the AI on how to design and style the UI based on the chosen "${data.uiStyle}" style. If a specific style is chosen, explain its core principles (e.g., colors, spacing, typography, component shapes) so the AI knows exactly how to build the UI. If a reference repo is provided for the style, mention it.
4. **Dev environment tips**: Specific tips for running the project locally (incorporate user's Dev Environment Tips or generate defaults if requested).
5. **Testing instructions**: How to run tests and what is expected before merging (incorporate user's Testing Instructions or generate defaults if requested).
6. **PR instructions**: Guidelines for creating Pull Requests (incorporate user's PR Instructions or generate defaults if requested).
7. **Coding Conventions**: Specific rules for writing code in this project (incorporate user's Coding Conventions or generate defaults if requested).
8. **Useful Commands Recap**: A markdown table summarizing useful commands (incorporate user's Useful Commands or generate defaults if requested).
9. **Reference Material**: Mention the provided GitHub links as context.

Make the tone professional, authoritative, and clear.
Ensure the formatting uses Markdown features like bolding, lists, and code blocks where appropriate.
Do not include any introductory or concluding remarks outside of the Markdown content itself. Just output the raw Markdown.
`;

    try {
      const ai = this.getAiInstance();
      const envKey = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
      const effectiveKey = this.settingsService.getEffectiveApiKey(envKey);

      if (!effectiveKey) {
        throw new Error('API_KEY_MISSING');
      }

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), 30000)
        )
      ]);
      return response.text || '';
    } catch (error) {
      console.error('Error generating AGENTS.md:', error);
      const err = error as Error;
      
      if (err.message === 'API_KEY_MISSING' || err.message === 'TIMEOUT') {
        throw err;
      }

      const errorMsg = err.message?.toLowerCase() || '';
      if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        throw new Error('QUOTA_EXCEEDED');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        throw new Error('NETWORK_ERROR');
      }
      
      throw new Error('UNKNOWN_ERROR');
    }
  }
}
