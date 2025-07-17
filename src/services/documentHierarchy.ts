import { OutlineDocument, OutlineDocumentCreateRequest } from "../types";
import { OutlineClient } from "./outlineClient";
import { TranslationService } from "./translationService";
import { TranslationTracker } from "./translationTracker";

export interface DocumentNode {
  document: OutlineDocument;
  children: DocumentNode[];
  parent?: DocumentNode;
}

export interface FolderMapping {
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
}

export class DocumentHierarchy {
  private outlineClient: OutlineClient;
  private translationService: TranslationService;
  private translationTracker: TranslationTracker;
  private sourceHierarchy: Map<string, DocumentNode> = new Map();
  private folderMappings: Map<string, FolderMapping> = new Map();

  constructor(
    outlineClient: OutlineClient,
    translationService: TranslationService,
    translationTracker: TranslationTracker
  ) {
    this.outlineClient = outlineClient;
    this.translationService = translationService;
    this.translationTracker = translationTracker;
  }

  /**
   * Build a hierarchy tree from a list of documents
   */
  buildHierarchy(documents: OutlineDocument[]): DocumentNode[] {
    console.log("🌳 Building document hierarchy...");

    // Create a map of all documents
    const documentMap = new Map<string, DocumentNode>();
    const rootNodes: DocumentNode[] = [];

    // First pass: create all nodes
    for (const doc of documents) {
      const node: DocumentNode = {
        document: doc,
        children: [],
      };
      documentMap.set(doc.id, node);
      this.sourceHierarchy.set(doc.id, node);
    }

    // Second pass: establish parent-child relationships
    for (const doc of documents) {
      const node = documentMap.get(doc.id)!;

      if (doc.parentDocumentId) {
        const parent = documentMap.get(doc.parentDocumentId);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        } else {
          // Parent not found in this collection, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent, this is a root document
        rootNodes.push(node);
      }
    }

    console.log(`✅ Built hierarchy with ${rootNodes.length} root documents`);
    return rootNodes;
  }

  /**
   * Get the full path from root to a document
   */
  getDocumentPath(documentId: string): DocumentNode[] {
    const path: DocumentNode[] = [];
    let current = this.sourceHierarchy.get(documentId);

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  /**
   * Ensure that the folder structure exists in the target collection
   * Returns the parent document ID where the final document should be created
   */
  async ensureFolderStructure(
    documentId: string,
    targetCollectionId: string,
    forceTranslate: boolean = false
  ): Promise<string | undefined> {
    const path = this.getDocumentPath(documentId);

    // Remove the last item (the document itself) to get just the folder path
    const folderPath = path.slice(0, -1);

    if (folderPath.length === 0) {
      // Document is at root level
      return undefined;
    }

    console.log(
      `📁 Ensuring folder structure for: ${folderPath
        .map((n) => n.document.title)
        .join(" > ")}`
    );

    let currentParentId: string | undefined = undefined;

    // Process each folder in the path
    for (let i = 0; i < folderPath.length; i++) {
      const folderNode = folderPath[i];
      if (!folderNode) {
        continue;
      }
      const sourceDoc = folderNode.document;

      // Check if we already have a mapping for this folder
      let existingMapping = this.folderMappings.get(sourceDoc.id);

      if (existingMapping) {
        currentParentId = existingMapping.targetId;
        continue;
      }

      // Also check if this document was already translated in a previous run
      if (this.translationTracker.isDocumentTranslated(sourceDoc.id)) {
        const existingTranslation =
          this.translationTracker.getTranslatedDocument(sourceDoc.id);
        if (existingTranslation) {
          console.log(
            `   ✅ Found existing translated folder: "${sourceDoc.title}" -> "${existingTranslation.translatedTitle}"`
          );
          const mapping: FolderMapping = {
            sourceId: sourceDoc.id,
            targetId: existingTranslation.translatedId,
            sourceName: sourceDoc.title,
            targetName: existingTranslation.translatedTitle,
          };
          this.folderMappings.set(sourceDoc.id, mapping);
          currentParentId = existingTranslation.translatedId;
          continue;
        }
      }

      // Translate the folder name
      console.log(`   🔤 Translating folder name: "${sourceDoc.title}" -> ...`);
      const translatedFolderName = await this.translationService.translateTitle(
        sourceDoc.title,
        forceTranslate
      );
      console.log(
        `   ✅ Translated folder name: "${sourceDoc.title}" -> "${translatedFolderName}"`
      );

      // Check if folder already exists in target collection
      const existingFolder = await this.findFolderByName(
        translatedFolderName,
        targetCollectionId,
        currentParentId
      );

      if (existingFolder) {
        // Folder exists, use it
        const mapping: FolderMapping = {
          sourceId: sourceDoc.id,
          targetId: existingFolder.id,
          sourceName: sourceDoc.title,
          targetName: translatedFolderName,
        };
        this.folderMappings.set(sourceDoc.id, mapping);
        currentParentId = existingFolder.id;
        console.log(`   ✅ Found existing folder: "${translatedFolderName}"`);
      } else {
        // Translate the folder content as well
        let translatedContent = "";
        if (sourceDoc.text && sourceDoc.text.trim().length > 0) {
          translatedContent = await this.translationService.translateToEnglish(
            sourceDoc.text,
            sourceDoc.title,
            forceTranslate
          );
        }

        // Create the folder
        const folderRequest: OutlineDocumentCreateRequest = {
          title: translatedFolderName,
          text: translatedContent, // Now using translated content
          collectionId: targetCollectionId,
        };

        if (currentParentId) {
          folderRequest.parentDocumentId = currentParentId;
        }

        if (sourceDoc.emoji) {
          folderRequest.emoji = sourceDoc.emoji;
        }

        const newFolder = await this.outlineClient.createDocument(
          folderRequest
        );

        // Track this folder creation in the translation tracker to prevent duplicates
        this.translationTracker.addTranslation(sourceDoc, newFolder);

        const mapping: FolderMapping = {
          sourceId: sourceDoc.id,
          targetId: newFolder.id,
          sourceName: sourceDoc.title,
          targetName: translatedFolderName,
        };
        this.folderMappings.set(sourceDoc.id, mapping);
        currentParentId = newFolder.id;
        console.log(
          `   ✅ Created folder: "${translatedFolderName}" (tracked as translated)`
        );
      }
    }

    return currentParentId;
  }

  /**
   * Find a folder by name in the target collection
   */
  private async findFolderByName(
    folderName: string,
    collectionId: string,
    parentId?: string
  ): Promise<OutlineDocument | null> {
    try {
      const documents = await this.outlineClient.getDocumentsByCollection(
        collectionId
      );

      return (
        documents.find(
          (doc) => doc.title === folderName && doc.parentDocumentId === parentId
        ) || null
      );
    } catch (error) {
      console.warn(
        `Warning: Could not search for folder "${folderName}": ${error}`
      );
      return null;
    }
  }

  /**
   * Get statistics about the hierarchy
   */
  printHierarchyStats(rootNodes: DocumentNode[]): void {
    let totalDocs = 0;
    let maxDepth = 0;

    const calculateStats = (nodes: DocumentNode[], depth: number = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const node of nodes) {
        totalDocs++;
        if (node.children.length > 0) {
          calculateStats(node.children, depth + 1);
        }
      }
    };

    calculateStats(rootNodes);

    console.log(`📊 Document Hierarchy Stats:`);
    console.log(`   Total documents: ${totalDocs}`);
    console.log(`   Root documents: ${rootNodes.length}`);
    console.log(`   Maximum depth: ${maxDepth + 1}`);
  }

  /**
   * Clear the mappings (useful for testing or reprocessing)
   */
  clearMappings(): void {
    this.folderMappings.clear();
    this.sourceHierarchy.clear();
  }
}
