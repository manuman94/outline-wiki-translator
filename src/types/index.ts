// Outline API Types
export interface OutlineDocument {
  id: string;
  title: string;
  text: string;
  emoji?: string;
  collectionId: string;
  parentDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  teamId: string;
  createdBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  updatedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  url: string;
  urlId: string;
}

export interface OutlineDocumentsListResponse {
  data: OutlineDocument[];
  pagination: {
    offset: number;
    limit: number;
  };
}

export interface OutlineDocumentInfoResponse {
  data: OutlineDocument;
}

export interface OutlineDocumentCreateRequest {
  title: string;
  text: string;
  emoji?: string;
  collectionId: string;
  parentDocumentId?: string;
  templateId?: string;
  template?: boolean;
  publish?: boolean;
  done?: boolean;
}

export interface OutlineDocumentCreateResponse {
  data: OutlineDocument;
}

// Internal Types
export interface TranslatedDocument {
  originalId: string;
  translatedId: string;
  originalTitle: string;
  translatedTitle: string;
  originalUpdatedAt: string;
  translatedAt: string;
}

export interface TranslationRecord {
  [originalDocumentId: string]: TranslatedDocument;
}

export interface Config {
  openaiApiKey: string;
  outlineApiKey: string;
  outlineApiUrl: string;
  sourceCollectionId: string;
  targetCollectionId: string;
  maxSpendingUsd?: number;
  batchSize?: number;
  dryRun?: boolean;
}

export interface TranslationStats {
  total: number;
  translated: number;
  skipped: number;
  errors: number;
  estimatedCostUsd?: number;
  actualCostUsd?: number;
}

export interface CostEstimate {
  totalDocuments: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  costPerDocument: number;
  modelUsed: string;
}

export interface OpenAIUsage {
  totalUsageUsd: number;
  currentMonthUsageUsd: number;
  remainingBudgetUsd?: number;
}
