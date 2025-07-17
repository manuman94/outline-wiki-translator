import * as dotenv from "dotenv";
import { Config } from "../types";

// Load environment variables
dotenv.config();

export function getConfig(): Config {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const outlineApiKey = process.env.OUTLINE_API_KEY;
  const outlineApiUrl = process.env.OUTLINE_API_URL;
  const sourceCollectionId = process.env.SOURCE_COLLECTION_ID;
  const targetCollectionId = process.env.TARGET_COLLECTION_ID;

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  if (!outlineApiKey) {
    throw new Error("OUTLINE_API_KEY environment variable is required");
  }

  if (!outlineApiUrl) {
    throw new Error("OUTLINE_API_URL environment variable is required");
  }

  if (!sourceCollectionId) {
    throw new Error("SOURCE_COLLECTION_ID environment variable is required");
  }

  if (!targetCollectionId) {
    throw new Error("TARGET_COLLECTION_ID environment variable is required");
  }

  return {
    openaiApiKey,
    outlineApiKey,
    outlineApiUrl: outlineApiUrl.replace(/\/$/, ""), // Remove trailing slash
    sourceCollectionId,
    targetCollectionId,
    ...(process.env.MAX_SPENDING_USD && {
      maxSpendingUsd: parseFloat(process.env.MAX_SPENDING_USD),
    }),
    ...(process.env.BATCH_SIZE && {
      batchSize: parseInt(process.env.BATCH_SIZE),
    }),
    ...(process.env.DRY_RUN === "true" && { dryRun: true }),
  };
}
