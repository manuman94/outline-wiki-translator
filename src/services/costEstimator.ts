import { OutlineDocument, CostEstimate } from "../types";

export class CostEstimator {
  // GPT-4o pricing (as of 2024)
  private static readonly GPT4O_INPUT_COST_PER_TOKEN = 0.0000025; // $2.50 per 1M input tokens
  private static readonly GPT4O_OUTPUT_COST_PER_TOKEN = 0.00001; // $10.00 per 1M output tokens

  // Average token estimates
  private static readonly CHARS_PER_TOKEN = 4; // Rough estimate for English text
  private static readonly SYSTEM_PROMPT_TOKENS = 100; // Estimated tokens for system prompt
  private static readonly TRANSLATION_OVERHEAD_TOKENS = 50; // Additional tokens for translation formatting

  static estimateDocumentCost(document: OutlineDocument): number {
    const inputTokens = this.estimateInputTokens(document);
    const outputTokens = this.estimateOutputTokens(document);

    const inputCost = inputTokens * this.GPT4O_INPUT_COST_PER_TOKEN;
    const outputCost = outputTokens * this.GPT4O_OUTPUT_COST_PER_TOKEN;

    return inputCost + outputCost;
  }

  static estimateBatchCost(documents: OutlineDocument[]): CostEstimate {
    const totalCost = documents.reduce(
      (sum, doc) => sum + this.estimateDocumentCost(doc),
      0
    );
    const totalTokens = documents.reduce(
      (sum, doc) =>
        sum + this.estimateInputTokens(doc) + this.estimateOutputTokens(doc),
      0
    );

    return {
      totalDocuments: documents.length,
      estimatedTokens: totalTokens,
      estimatedCostUsd: totalCost,
      costPerDocument: documents.length > 0 ? totalCost / documents.length : 0,
      modelUsed: "gpt-4o",
    };
  }

  private static estimateInputTokens(document: OutlineDocument): number {
    const contentLength =
      (document.text || "").length + (document.title || "").length;
    const contentTokens = Math.ceil(contentLength / this.CHARS_PER_TOKEN);

    return (
      contentTokens +
      this.SYSTEM_PROMPT_TOKENS +
      this.TRANSLATION_OVERHEAD_TOKENS
    );
  }

  private static estimateOutputTokens(document: OutlineDocument): number {
    // Assume output is roughly the same length as input for translation
    const contentLength =
      (document.text || "").length + (document.title || "").length;
    return Math.ceil(contentLength / this.CHARS_PER_TOKEN);
  }

  static printCostEstimate(estimate: CostEstimate): void {
    console.log("\n💰 Cost Estimation:");
    console.log(`   Model: ${estimate.modelUsed}`);
    console.log(`   Documents to translate: ${estimate.totalDocuments}`);
    console.log(
      `   Estimated tokens: ${estimate.estimatedTokens.toLocaleString()}`
    );
    console.log(`   Estimated cost: $${estimate.estimatedCostUsd.toFixed(4)}`);
    console.log(
      `   Average cost per document: $${estimate.costPerDocument.toFixed(4)}`
    );

    if (estimate.estimatedCostUsd > 10) {
      console.log(
        "   ⚠️  High cost detected! Consider translating in smaller batches."
      );
    } else if (estimate.estimatedCostUsd > 1) {
      console.log("   ⚠️  Moderate cost. Monitor your usage.");
    } else {
      console.log("   ✅ Low cost estimate.");
    }
  }

  static confirmCostWithUser(
    estimate: CostEstimate,
    maxSpending?: number
  ): boolean {
    this.printCostEstimate(estimate);

    if (maxSpending && estimate.estimatedCostUsd > maxSpending) {
      console.log(
        `\n❌ Estimated cost ($${estimate.estimatedCostUsd.toFixed(
          4
        )}) exceeds your maximum spending limit ($${maxSpending.toFixed(2)})`
      );
      console.log("   Options:");
      console.log("   1. Increase MAX_SPENDING_USD in your .env file");
      console.log("   2. Reduce BATCH_SIZE to translate fewer documents");
      console.log("   3. Use DRY_RUN=true to preview without spending");
      return false;
    }

    return true;
  }

  static shouldProceedWithCost(
    estimate: CostEstimate,
    maxSpending?: number
  ): boolean {
    if (estimate.estimatedCostUsd === 0) {
      return true; // No cost, proceed
    }

    if (maxSpending && estimate.estimatedCostUsd > maxSpending) {
      return false;
    }

    // For costs over $1, show a warning
    if (estimate.estimatedCostUsd > 1) {
      console.log(
        `\n⚠️  Translation will cost approximately $${estimate.estimatedCostUsd.toFixed(
          4
        )}`
      );
      console.log("   Set MAX_SPENDING_USD in your .env file to control costs");
    }

    return true;
  }
}
