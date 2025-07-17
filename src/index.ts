import { getConfig } from "./config";
import { OutlineClient } from "./services/outlineClient";
import { TranslationService } from "./services/translationService";
import { TranslationTracker } from "./services/translationTracker";
import { CostEstimator } from "./services/costEstimator";
import { UsageMonitor } from "./services/usageMonitor";
import { DocumentHierarchy } from "./services/documentHierarchy";
import { TranslationStats, OutlineDocumentCreateRequest } from "./types";

async function main(): Promise<void> {
  console.log("🚀 Starting Outline Translation Process...\n");

  try {
    // Load configuration
    const config = getConfig();
    console.log("✅ Configuration loaded successfully");

    // Initialize services
    const outlineClient = new OutlineClient(config);
    const translationService = new TranslationService(config);
    const tracker = new TranslationTracker();
    const usageMonitor = new UsageMonitor(config.openaiApiKey);
    const documentHierarchy = new DocumentHierarchy(
      outlineClient,
      translationService,
      tracker
    );

    console.log("✅ Services initialized\n");

    // Show cost control information
    if (config.dryRun) {
      console.log(
        "🔍 DRY RUN MODE: Will translate first document only for testing"
      );
    }

    usageMonitor.printUsageGuidance();

    // Print existing translation statistics
    tracker.printStats();

    // Fetch documents from the specified source collection
    console.log(
      `📚 Fetching documents from source collection: ${config.sourceCollectionId}`
    );
    const documents = await outlineClient.getDocumentsByCollection(
      config.sourceCollectionId
    );

    if (documents.length === 0) {
      console.log(
        `ℹ️ No documents found in source collection ${config.sourceCollectionId}`
      );
      return;
    }

    // Build document hierarchy for folder structure replication
    console.log(`\n🔍 Documents found in source collection:`);
    documents.forEach((doc, index) => {
      console.log(
        `   ${index + 1}. "${doc.title}" (ID: ${doc.id})${
          doc.parentDocumentId
            ? ` - Parent: ${doc.parentDocumentId}`
            : " - ROOT"
        }`
      );
    });

    const rootNodes = documentHierarchy.buildHierarchy(documents);
    documentHierarchy.printHierarchyStats(rootNodes);

    console.log(`\n🌳 Root documents in hierarchy:`);
    rootNodes.forEach((node, index) => {
      console.log(
        `   ${index + 1}. "${node.document.title}" (ID: ${node.document.id})`
      );
    });

    // Filter out documents that are already translated and up-to-date
    const documentsToTranslate = documents.filter((doc) => {
      if (tracker.isDocumentTranslated(doc.id)) {
        if (tracker.needsUpdate(doc)) {
          console.log(
            `🔄 Document "${doc.title}" needs updating (modified since last translation)`
          );
          return true;
        } else {
          console.log(
            `⏭️ Skipping "${doc.title}" (already translated and up-to-date)`
          );
          return false;
        }
      }
      return true;
    });

    console.log(`\n📋 Translation Summary:`);
    console.log(`   Source collection: ${config.sourceCollectionId}`);
    console.log(`   Target collection: ${config.targetCollectionId}`);
    console.log(`   Total documents: ${documents.length}`);
    console.log(`   To translate: ${documentsToTranslate.length}`);
    console.log(
      `   Already translated: ${
        documents.length - documentsToTranslate.length
      }\n`
    );

    if (documentsToTranslate.length === 0) {
      console.log("✅ All documents are already translated and up-to-date!");
      return;
    }

    // Apply batch size limit if configured
    const batchSize = config.batchSize || documentsToTranslate.length;
    const documentsToProcess = documentsToTranslate.slice(0, batchSize);

    if (documentsToProcess.length < documentsToTranslate.length) {
      console.log(
        `📦 Batch Processing: Translating ${documentsToProcess.length} of ${documentsToTranslate.length} documents`
      );
      console.log(`   Set BATCH_SIZE=<number> to control batch size`);
    }

    // Cost estimation and spending limit check
    const documentsForCostEstimate = config.dryRun
      ? documentsToProcess.slice(0, 1) // Only estimate cost for first document in dry run
      : documentsToProcess;

    const costEstimate = CostEstimator.estimateBatchCost(
      documentsForCostEstimate
    );

    if (config.dryRun) {
      console.log(`\n💰 DRY RUN Cost Estimate:`);
      console.log(
        `   First document: $${costEstimate.estimatedCostUsd.toFixed(4)}`
      );

      if (documentsToProcess.length > 1) {
        const fullCostEstimate =
          CostEstimator.estimateBatchCost(documentsToProcess);
        console.log(
          `   All ${
            documentsToProcess.length
          } documents would cost: $${fullCostEstimate.estimatedCostUsd.toFixed(
            4
          )}`
        );
      }
    } else {
      CostEstimator.printCostEstimate(costEstimate);
    }

    if (
      !CostEstimator.confirmCostWithUser(costEstimate, config.maxSpendingUsd)
    ) {
      console.log("\n❌ Translation cancelled due to cost limits");
      return;
    }

    if (
      !(await usageMonitor.checkSpendingLimit(
        costEstimate.estimatedCostUsd,
        config.maxSpendingUsd
      ))
    ) {
      console.log("\n❌ Translation cancelled due to spending limits");
      return;
    }

    // Translation statistics
    const fullCostEstimate =
      CostEstimator.estimateBatchCost(documentsToProcess);
    const stats: TranslationStats = {
      total: documentsToProcess.length,
      translated: 0,
      skipped: 0,
      errors: 0,
      estimatedCostUsd: fullCostEstimate.estimatedCostUsd, // Always store full estimate for reporting
      actualCostUsd: 0,
    };

    console.log(`\n🚀 Starting translation process...\n`);

    // Process each document
    for (let i = 0; i < documentsToProcess.length; i++) {
      const doc = documentsToProcess[i];

      if (!doc) {
        console.error(`   ❌ Document at index ${i} is undefined, skipping`);
        stats.errors++;
        continue;
      }

      const isFirstDoc = i === 0;

      console.log(
        `\n[${i + 1}/${documentsToProcess.length}] Processing: "${doc.title}"`
      );

      if (config.dryRun && !isFirstDoc) {
        console.log(
          `   🔍 DRY RUN: Skipping document ${
            i + 1
          } (only first document is translated in dry run)`
        );
        stats.skipped++;
        continue;
      }

      try {
        // Check if document already has a translation recorded
        const isAlreadyTranslated = tracker.isDocumentTranslated(doc.id);

        if (isAlreadyTranslated && !tracker.needsUpdate(doc)) {
          console.log(
            `   ⏭️ Translation already exists and is up-to-date, skipping`
          );
          stats.skipped++;
          continue;
        }

        // Get full document content
        const fullDoc = await outlineClient.getDocumentInfo(doc.id);

        // Skip if document has no content
        if (!fullDoc.text || fullDoc.text.trim().length === 0) {
          console.log(`   ⏭️ Document has no content, skipping`);
          stats.skipped++;
          continue;
        }

        // Translate content and title (force translation for first doc in dry run)
        const forceTranslate = config.dryRun && isFirstDoc;

        // Ensure folder structure exists and get parent document ID
        const parentDocumentId = await documentHierarchy.ensureFolderStructure(
          doc.id,
          config.targetCollectionId,
          forceTranslate
        );

        const [translatedContent, translatedTitle] = await Promise.all([
          translationService.translateToEnglish(
            fullDoc.text,
            fullDoc.title,
            forceTranslate
          ),
          translationService.translateTitle(fullDoc.title, forceTranslate),
        ]);

        // Create the translated document in the target collection
        const createRequest: OutlineDocumentCreateRequest = {
          title: translatedTitle, // No prefix since documents go into separate collection
          text: translatedContent,
          collectionId: config.targetCollectionId,
        };

        // Set parent document ID to maintain folder structure
        if (parentDocumentId) {
          createRequest.parentDocumentId = parentDocumentId;
        }

        // Only add emoji if it exists
        if (fullDoc.emoji) {
          createRequest.emoji = fullDoc.emoji;
        }

        const newDocument = await outlineClient.createDocument(createRequest);

        // Track the translation
        tracker.addTranslation(fullDoc, newDocument);
        stats.translated++;

        if (config.dryRun && isFirstDoc) {
          console.log(
            `   ✅ DRY RUN: First document translated successfully for testing`
          );
        } else {
          console.log(`   ✅ Translation completed and saved`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to translate "${doc.title}":`, error);
        stats.errors++;
      }

      // Add a small delay to avoid rate limiting
      if (i < documentsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Print final statistics
    console.log(`\n🎯 Translation Process Completed!`);
    console.log(`   ✅ Successfully translated: ${stats.translated}`);
    console.log(`   ⏭️ Skipped: ${stats.skipped}`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   📊 Total processed: ${stats.total}`);

    if (config.dryRun) {
      console.log(
        `   🔍 DRY RUN: First document translated, remaining ${
          documentsToProcess.length - 1
        } documents skipped`
      );
      console.log(
        `   💰 First document cost + estimated cost for remaining: $${stats.estimatedCostUsd?.toFixed(
          4
        )}`
      );
    } else {
      console.log(
        `   💰 Estimated cost: $${stats.estimatedCostUsd?.toFixed(4)}`
      );
      if (stats.actualCostUsd) {
        console.log(`   💰 Actual cost: $${stats.actualCostUsd.toFixed(6)}`);
      }
    }

    if (stats.errors > 0) {
      console.log(
        `\n⚠️ Some documents failed to translate. Check the logs above for details.`
      );
    }

    // Print updated statistics
    console.log("");
    tracker.printStats();
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}
