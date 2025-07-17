import OpenAI from "openai";
import { Config } from "../types";
import { UsageMonitor } from "./usageMonitor";

export class TranslationService {
  private readonly model: string;
  private openai: OpenAI;
  private usageMonitor: UsageMonitor;
  private dryRun: boolean;

  constructor(config: Config) {
    this.model = config.model || "gpt-4o";
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    this.usageMonitor = new UsageMonitor(config.openaiApiKey);
    this.dryRun = config.dryRun || false;
  }

  async translateToEnglish(
    content: string,
    title: string,
    forceTranslate: boolean = false
  ): Promise<string> {
    console.log(`🌐 Translating document: "${title}"`);

    if (this.dryRun && !forceTranslate) {
      console.log(
        `   🔍 DRY RUN: Would translate document (${content.length} characters)`
      );
      return `[DRY RUN] Translated: ${content.substring(0, 100)}...`;
    }

    if (this.isAlreadyInEnglish(content)) {
      console.log(
        `   Document appears to already be in English, skipping translation`
      );
      return content;
    }

    const prompt = this.createTranslationPrompt(content);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator specializing in technical documentation. Translate the given markdown content to English while preserving ALL formatting, structure, links, and markdown syntax exactly as they are. Only translate the actual text content, not markdown syntax, URLs, or code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 4000,
      });

      const translatedContent = response.choices[0]?.message?.content;

      if (!translatedContent) {
        throw new Error("OpenAI returned empty translation");
      }

      // Track actual usage if available
      if (response.usage) {
        this.usageMonitor.trackTranslationCost(
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
      }

      console.log(`✅ Translation completed for "${title}"`);
      return translatedContent.trim();
    } catch (error) {
      console.error(`❌ Translation failed for "${title}":`, error);
      throw new Error(
        `Translation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private createTranslationPrompt(content: string): string {
    return `Please translate the following markdown content to English. 

IMPORTANT RULES:
1. Preserve ALL markdown formatting exactly (headers, lists, links, code blocks, etc.)
2. Do not translate URLs, code snippets, or markdown syntax
3. Only translate the actual readable text content
4. Maintain the exact same structure and spacing
5. If content is already in English, return it unchanged

Content to translate:

${content}`;
  }

  private isAlreadyInEnglish(content: string): boolean {
    // Simple heuristic to detect if content might already be in English
    // This checks for common English words and patterns
    const englishWords = [
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "up",
      "about",
      "into",
      "over",
      "after",
      "this",
      "that",
      "these",
      "those",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
    ];

    const words = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const englishWordCount = words.filter((word) =>
      englishWords.includes(word)
    ).length;
    const totalWords = words.length;

    // If more than 30% of words are common English words, assume it's English
    return totalWords > 0 && englishWordCount / totalWords > 0.3;
  }

  async translateTitle(
    title: string,
    forceTranslate: boolean = false
  ): Promise<string> {
    if (this.dryRun && !forceTranslate) {
      console.log(`   🔍 DRY RUN: Would translate title "${title}"`);
      return `[DRY RUN] Translated: ${title}`;
    }

    if (this.isAlreadyInEnglish(title)) {
      return title;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Translate the given title to English. Return only the translated title without any quotes, formatting, or additional text.",
          },
          {
            role: "user",
            content: `Translate this title to English: ${title}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      // Track usage for title translation too
      if (response.usage) {
        this.usageMonitor.trackTranslationCost(
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
      }

      return response.choices[0]?.message?.content?.trim() || title;
    } catch (error) {
      console.warn(`Warning: Could not translate title "${title}":`, error);
      return title; // Return original title if translation fails
    }
  }
}
