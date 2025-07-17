import { OpenAIUsage } from "../types";

export class UsageMonitor {
  constructor(_apiKey: string) {
    // Store API key for potential future OpenAI billing API integration
    // Currently OpenAI doesn't provide direct billing API access
  }

  async getCurrentUsage(): Promise<OpenAIUsage | null> {
    try {
      console.log("📊 Checking OpenAI API usage...");

      // Note: OpenAI doesn't provide a direct billing API endpoint in their SDK
      // This is a placeholder for the concept - users would need to check their dashboard
      console.log(
        "ℹ️  OpenAI usage can be checked at: https://platform.openai.com/usage"
      );

      return {
        totalUsageUsd: 0, // Would need to be retrieved from OpenAI dashboard/API
        currentMonthUsageUsd: 0,
      };
    } catch (error) {
      console.warn("⚠️  Could not retrieve OpenAI usage data:", error);
      console.log(
        "💡 Manually check your usage at: https://platform.openai.com/usage"
      );
      return null;
    }
  }

  async checkSpendingLimit(
    estimatedCost: number,
    maxSpending?: number
  ): Promise<boolean> {
    if (!maxSpending) {
      console.log(
        "ℹ️  No spending limit set. Set MAX_SPENDING_USD in .env to enable cost controls."
      );
      return true;
    }

    console.log(`\n💰 Cost Control Check:`);
    console.log(`   Maximum spending limit: $${maxSpending.toFixed(2)}`);
    console.log(`   Estimated translation cost: $${estimatedCost.toFixed(4)}`);

    if (estimatedCost > maxSpending) {
      console.log(`   ❌ BLOCKED: Estimated cost exceeds spending limit`);
      console.log(`   💡 To proceed:`);
      console.log(`      - Increase MAX_SPENDING_USD in your .env file`);
      console.log(`      - Reduce batch size with BATCH_SIZE=<number>`);
      console.log(`      - Use DRY_RUN=true to preview without spending`);
      return false;
    }

    const percentOfLimit = (estimatedCost / maxSpending) * 100;

    if (percentOfLimit > 50) {
      console.log(
        `   ⚠️  HIGH: Using ${percentOfLimit.toFixed(1)}% of spending limit`
      );
    } else if (percentOfLimit > 25) {
      console.log(
        `   ⚠️  MODERATE: Using ${percentOfLimit.toFixed(1)}% of spending limit`
      );
    } else {
      console.log(
        `   ✅ LOW: Using ${percentOfLimit.toFixed(1)}% of spending limit`
      );
    }

    return true;
  }

  printUsageGuidance(): void {
    console.log("\n💡 Cost Control Tips:");
    console.log(
      "   • Set MAX_SPENDING_USD=10.00 in .env to limit spending to $5"
    );
    console.log(
      "   • Use BATCH_SIZE=1 to translate only 1 documents at a time"
    );
    console.log(
      "   • Use DRY_RUN=true to preview translations without API calls"
    );
    console.log("   • Monitor usage at: https://platform.openai.com/usage");
    console.log(
      "   • GPT-4o costs ~$0.01-0.05 per document (varies by length)"
    );
  }

  static calculateActualCost(
    inputTokens: number,
    outputTokens: number
  ): number {
    const INPUT_COST_PER_TOKEN = 0.0000025; // $2.50 per 1M tokens
    const OUTPUT_COST_PER_TOKEN = 0.00001; // $10.00 per 1M tokens

    return (
      inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
    );
  }

  trackTranslationCost(inputTokens: number, outputTokens: number): number {
    const cost = UsageMonitor.calculateActualCost(inputTokens, outputTokens);
    console.log(
      `   💰 Translation cost: $${cost.toFixed(6)} (${
        inputTokens + outputTokens
      } tokens)`
    );
    return cost;
  }
}
