import { OutlineClient } from "./services/outlineClient";

async function listCollections(): Promise<void> {
  console.log("🔍 Listing Outline Collections...\n");

  try {
    // Load configuration (only need Outline API settings)
    const config = {
      openaiApiKey: "dummy", // Not needed for listing collections
      outlineApiKey: process.env.OUTLINE_API_KEY || "",
      outlineApiUrl: process.env.OUTLINE_API_URL || "",
      sourceCollectionId: "dummy", // Not needed for listing
      targetCollectionId: "dummy", // Not needed for listing
    };

    if (!config.outlineApiKey) {
      throw new Error("OUTLINE_API_KEY environment variable is required");
    }

    if (!config.outlineApiUrl) {
      throw new Error("OUTLINE_API_URL environment variable is required");
    }

    // Initialize Outline client
    const outlineClient = new OutlineClient(config);

    // Fetch collections
    const collections = await outlineClient.getCollections();

    if (collections.length === 0) {
      console.log("ℹ️ No collections found in your Outline instance");
      return;
    }

    console.log(`📁 Found ${collections.length} collections:\n`);

    // Display collections in a nice format
    collections.forEach((collection: any, index: number) => {
      console.log(`${index + 1}. ${collection.name}`);
      console.log(`   ID: ${collection.id}`);
      console.log(
        `   Description: ${collection.description || "No description"}`
      );
      console.log(`   Documents: ${collection.documents?.length || 0}`);
      if (collection.url) {
        console.log(`   URL: ${collection.url}`);
      }
      console.log("");
    });

    console.log("💡 Copy the collection IDs you need for your .env file:");
    console.log("   SOURCE_COLLECTION_ID=<source_collection_id>");
    console.log("   TARGET_COLLECTION_ID=<target_collection_id>");
  } catch (error) {
    console.error("💥 Error listing collections:", error);
    process.exit(1);
  }
}

// Run the function
if (require.main === module) {
  listCollections().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}
