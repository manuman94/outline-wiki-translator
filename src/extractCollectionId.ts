#!/usr/bin/env node

/**
 * Simple utility to extract collection IDs from Outline URLs
 * Usage: npm run extract-id "https://docs.example.com/collection/my-docs-abc123"
 */

function extractCollectionId(url: string): string | null {
  try {
    // Remove trailing slashes and parse the URL
    const cleanUrl = url.replace(/\/+$/, "");
    const urlObj = new URL(cleanUrl);

    // Check if it's a collection URL
    if (!urlObj.pathname.includes("/collection/")) {
      console.error("❌ This doesn't appear to be a collection URL");
      console.error(
        "   Expected format: https://your-outline.com/collection/collection-name-ID"
      );
      return null;
    }

    // Extract the collection path
    const pathParts = urlObj.pathname.split("/");
    const collectionIndex = pathParts.indexOf("collection");

    if (collectionIndex === -1 || collectionIndex + 1 >= pathParts.length) {
      console.error("❌ Invalid collection URL format");
      return null;
    }

    const collectionSlug = pathParts[collectionIndex + 1];

    if (!collectionSlug) {
      console.error("❌ No collection slug found in URL");
      return null;
    }

    // The collection ID is typically after the last dash
    const parts = collectionSlug.split("-");
    if (parts.length < 2) {
      console.error("❌ Could not extract collection ID from URL");
      console.error("   Expected format: collection-name-ID");
      return null;
    }

    const collectionId = parts[parts.length - 1];

    if (!collectionId) {
      console.error("❌ Could not extract collection ID from URL");
      return null;
    }

    // Basic validation - collection IDs are usually alphanumeric and 10+ chars
    if (collectionId.length < 8 || !/^[a-zA-Z0-9]+$/.test(collectionId)) {
      console.error("❌ Extracted ID doesn't look like a valid collection ID");
      console.error(`   Extracted: "${collectionId}"`);
      console.error(
        "   Collection IDs are usually 10+ alphanumeric characters"
      );
      return null;
    }

    return collectionId;
  } catch (error) {
    console.error("❌ Invalid URL format");
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🔍 Collection ID Extractor\n");
    console.log(
      'Usage: npm run extract-id "https://your-outline.com/collection/my-docs-abc123"\n'
    );
    console.log("Examples:");
    console.log(
      '  npm run extract-id "https://docs.company.com/collection/user-guides-aAVI4oCfz0"'
    );
    console.log(
      '  npm run extract-id "https://docs.company.com/collection/translations-PeAb83BeVl"'
    );
    process.exit(0);
  }

  const url = args[0];

  if (!url) {
    console.error("❌ No URL provided");
    process.exit(1);
  }
  console.log(`🔍 Extracting collection ID from: ${url}\n`);

  const collectionId = extractCollectionId(url);

  if (collectionId) {
    console.log(`✅ Collection ID: ${collectionId}\n`);
    console.log("💡 Add this to your .env file:");
    console.log(`   SOURCE_COLLECTION_ID=${collectionId}`);
    console.log("   or");
    console.log(`   TARGET_COLLECTION_ID=${collectionId}`);
  } else {
    console.log("\n💡 Tips:");
    console.log("   • Make sure the URL is from your Outline instance");
    console.log('   • The URL should include "/collection/" in the path');
    console.log(
      "   • Collection URLs typically look like: /collection/name-ID"
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
