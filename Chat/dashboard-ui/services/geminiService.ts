import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProjectFile } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateCodePatch(file: ProjectFile, instruction: string): Promise<string> {
    const prompt = `
You are an expert software engineer. I need you to modify the following code file based on the user's instruction.

FILE: ${file.path}
TYPE: ${file.type}
DESCRIPTION: ${file.description}

CURRENT CODE:
${file.content}

USER INSTRUCTION: "${instruction}"

Please provide ONLY the modified code. Do not include any explanations, comments, or markdown formatting. Just return the complete updated code file.

The code should be:
- PEP8 compliant (if Python)
- Properly formatted
- Include necessary imports
- Follow best practices for the language
- Maintain the existing code structure where possible
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const modifiedCode = response.text().trim();

      // Remove any markdown code blocks if present
      return modifiedCode.replace(/^```[\w]*\n?/gm, '').replace(/```\n?$/gm, '');
    } catch (error) {
      console.error('Error generating code patch:', error);
      throw new Error('Failed to generate code patch. Please check your API key and try again.');
    }
  }

  async explainChanges(originalFile: ProjectFile, newContent: string, instruction: string): Promise<string> {
    const prompt = `
You are an expert software engineer explaining code changes to a developer.

ORIGINAL FILE: ${originalFile.path}
USER INSTRUCTION: "${instruction}"

ORIGINAL CODE:
${originalFile.content}

MODIFIED CODE:
${newContent}

Please provide a clear, concise explanation of what changed and why. Focus on:
- What functionality was added/modified/removed
- Why this change improves the code
- Any important technical details

Keep the explanation under 200 words and use simple language.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating explanation:', error);
      return 'Unable to generate explanation at this time.';
    }
  }

  async suggestImprovements(file: ProjectFile): Promise<string[]> {
    const prompt = `
You are a senior software engineer reviewing code. Analyze this file and suggest 3-5 specific improvements.

FILE: ${file.path}
TYPE: ${file.type}

CODE:
${file.content}

Provide suggestions as a JSON array of strings, like:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]

Focus on:
- Code quality and readability
- Performance improvements
- Security considerations
- Best practices
- Error handling

Only return the JSON array, no other text.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch {
        // Fallback: extract suggestions from text
        const lines = text.split('\n').filter(line =>
          line.trim().length > 0 &&
          !line.includes('[') &&
          !line.includes(']') &&
          !line.includes('"')
        );
        return lines.slice(0, 5);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return ['Unable to generate suggestions at this time.'];
    }
  }
}
