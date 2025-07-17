import * as fs from "fs";
import * as path from "path";
import {
  TranslationRecord,
  TranslatedDocument,
  OutlineDocument,
} from "../types";

export class TranslationTracker {
  private filePath: string;
  private translations: TranslationRecord;

  constructor(filePath: string = "./translatedDocs.json") {
    this.filePath = path.resolve(filePath);
    this.translations = this.loadTranslations();
  }

  private loadTranslations(): TranslationRecord {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(
        `Warning: Could not load translation records from ${this.filePath}:`,
        error
      );
    }

    return {};
  }

  private saveTranslations(): void {
    try {
      const data = JSON.stringify(this.translations, null, 2);
      fs.writeFileSync(this.filePath, data, "utf-8");
    } catch (error) {
      console.error(
        `Error saving translation records to ${this.filePath}:`,
        error
      );
      throw error;
    }
  }

  isDocumentTranslated(documentId: string): boolean {
    return documentId in this.translations;
  }

  getTranslatedDocument(documentId: string): TranslatedDocument | undefined {
    return this.translations[documentId];
  }

  addTranslation(
    originalDoc: OutlineDocument,
    translatedDoc: OutlineDocument
  ): void {
    const translatedDocument: TranslatedDocument = {
      originalId: originalDoc.id,
      translatedId: translatedDoc.id,
      originalTitle: originalDoc.title,
      translatedTitle: translatedDoc.title,
      originalUpdatedAt: originalDoc.updatedAt,
      translatedAt: new Date().toISOString(),
    };

    this.translations[originalDoc.id] = translatedDocument;
    this.saveTranslations();

    console.log(
      `📝 Recorded translation: "${originalDoc.title}" -> "${translatedDoc.title}"`
    );
  }

  needsUpdate(document: OutlineDocument): boolean {
    const existingTranslation = this.getTranslatedDocument(document.id);

    if (!existingTranslation) {
      return false; // Not translated yet, so doesn't need update
    }

    // Check if the original document was updated after our translation
    const originalUpdated = new Date(document.updatedAt);
    const translatedAt = new Date(existingTranslation.translatedAt);

    return originalUpdated > translatedAt;
  }

  removeTranslation(documentId: string): void {
    if (documentId in this.translations) {
      delete this.translations[documentId];
      this.saveTranslations();
      console.log(
        `🗑️ Removed translation record for document ID: ${documentId}`
      );
    }
  }

  getAllTranslations(): TranslationRecord {
    return { ...this.translations }; // Return a copy
  }

  getStats(): {
    totalTranslations: number;
    oldestTranslation: string | null;
    newestTranslation: string | null;
  } {
    const translations = Object.values(this.translations);

    if (translations.length === 0) {
      return {
        totalTranslations: 0,
        oldestTranslation: null,
        newestTranslation: null,
      };
    }

    const sortedByDate = translations.sort(
      (a, b) =>
        new Date(a.translatedAt).getTime() - new Date(b.translatedAt).getTime()
    );

    return {
      totalTranslations: translations.length,
      oldestTranslation: sortedByDate[0]?.translatedAt || null,
      newestTranslation:
        sortedByDate[sortedByDate.length - 1]?.translatedAt || null,
    };
  }

  printStats(): void {
    const stats = this.getStats();
    console.log(`\n📊 Translation Statistics:`);
    console.log(`   Total translated documents: ${stats.totalTranslations}`);

    if (stats.oldestTranslation && stats.newestTranslation) {
      console.log(
        `   Oldest translation: ${new Date(
          stats.oldestTranslation
        ).toLocaleDateString()}`
      );
      console.log(
        `   Newest translation: ${new Date(
          stats.newestTranslation
        ).toLocaleDateString()}`
      );
    }
  }
}
