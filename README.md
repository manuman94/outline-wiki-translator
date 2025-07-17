# Outline Wiki Translator

Automatically translate all documents from an Outline Wiki into English using OpenAI GPT-4o. This tool maintains the exact Markdown structure and creates translated documents as child pages of the originals.

## ✨ Features

- **Collection-Based Translation**: Select specific source collections and organize translations in target collections
- **Document Hierarchy Replication**: Automatically recreates the complete folder structure from source to target collection
- **Automatic Translation**: Uses OpenAI GPT-4o to translate documents while preserving Markdown formatting
- **Intermediate Document Translation**: Translates folder/parent documents content, not just leaf documents
- **Smart Tracking**: Maintains a record of translated documents to avoid duplicates
- **Hierarchy Duplicate Prevention**: Advanced tracking prevents creating duplicate folders when processing documents in different orders
- **Update Detection**: Identifies when original documents have been modified since translation
- **Emoji Preservation**: Maintains original document emojis in translated versions
- **Title Quote Removal**: Automatically removes erroneous quotes from translated titles
- **Organized Output**: Creates all translations in a dedicated target collection for easy management
- **Collection Discovery**: Built-in helper to list and identify collection IDs
- **Cost Control**: Set spending limits, batch sizes, and dry-run modes to control API costs
- **Cost Estimation**: Preview estimated costs before translation starts
- **Progress Tracking**: Detailed logging and statistics throughout the process
- **Rate Limiting**: Built-in delays to respect API rate limits

## 📋 Requirements

- Node.js 18.0.0 or higher
- OpenAI API account with GPT-4o access
- Outline Wiki instance with API access

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the project
cd outline-translate

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Outline API Configuration
OUTLINE_API_KEY=your_outline_api_key_here
OUTLINE_API_URL=https://your-outline-instance.com/api

# Collection Configuration
# Use 'npm run list-collections' to find these IDs
SOURCE_COLLECTION_ID=your_source_collection_id_here
TARGET_COLLECTION_ID=your_target_collection_id_here

# Cost Control (Optional)
MAX_SPENDING_USD=10.00
BATCH_SIZE=5
DRY_RUN=false
```

### 2.5. Find Your Collection IDs (Required)

Before running translations, you need to identify your source and target collections:

```bash
# First, set up your Outline credentials
export OUTLINE_API_KEY=your_outline_api_key_here
export OUTLINE_API_URL=https://your-outline-instance.com/api

# List all available collections
npm run list-collections
```

This will show you all collections with their IDs, names, and document counts. Copy the IDs you need into your `.env` file.

**Quick ID Extraction from URLs:**
If you have collection URLs from Outline's interface, the collection ID is the part after the last dash:

- `https://docs.example.com/collection/my-docs-aAVI4oCfz0` → ID: `aAVI4oCfz0`
- `https://docs.example.com/collection/translations-PeAb83BeVl` → ID: `PeAb83BeVl`

**Getting API Keys:**

- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Outline API Key**: Go to your Outline instance → Settings → API → Create new token
- **Outline API URL**: Your Outline instance URL + `/api` (e.g., `https://knowledge.yourcompany.com/api`)
- **SOURCE_COLLECTION_ID**: The ID of the collection containing documents to translate
- **TARGET_COLLECTION_ID**: The ID of the collection where translated documents will be created

### 3. Run Translation

```bash
npm run start
```

## 📊 How It Works

1. **Collection Selection**: Fetches documents from your specified source collection using the `/documents.list` endpoint
2. **Hierarchy Analysis**: Builds a complete document tree structure to understand folder relationships
3. **Content Analysis**: Downloads full content for each document via `/documents.info`
4. **Folder Structure Creation**: Creates the translated folder hierarchy in target collection before translating documents
5. **Smart Translation**: Uses OpenAI GPT-4o to translate both content and titles while preserving Markdown structure
6. **Document Creation**: Creates translated documents in their correct hierarchical position (no prefix needed)
7. **Duplicate Prevention**: Tracks all translations to prevent creating duplicate folders or documents
8. **Organization**: Maintains the exact folder structure from source in the target collection
9. **Progress Tracking**: Saves translation records in `translatedDocs.json` to avoid re-processing

### 🌳 Document Hierarchy Replication

The tool automatically replicates the complete folder structure from your source collection:

**Example Structure:**

```
Source Collection (Spanish):           Target Collection (English):
├── Lore                              ├── Lore
│   ├── Personajes                    │   ├── Characters
│   │   └── Rey Arturo                │   │   └── King Arthur
│   └── Lugares                       │   └── Places
│       └── Camelot                   │       └── Camelot
└── Game Mechanics                    └── Game Mechanics
    └── Combat System                     └── Combat System
```

**Key Features:**

- **Folder Names Translated**: `"Personajes"` → `"Characters"`
- **Folder Content Translated**: All intermediate documents get their content translated
- **Hierarchy Preserved**: Documents appear in the same relative structure
- **Duplicate Prevention**: Smart tracking prevents creating duplicate folders
- **Emoji Preservation**: Folder emojis are maintained in translations

**Processing Order Independence:**

- Whether you translate a deep document first or its parent folder first, no duplicates are created
- The system tracks all folder creation and reuses existing translated folders
- Perfect for batch processing with any `BATCH_SIZE` setting

### 🔍 Finding Collection IDs

To find your collection IDs:

1. **Using the built-in helper** (Recommended):

   ```bash
   # Set up your Outline API credentials first
   export OUTLINE_API_KEY=your_outline_api_key_here
   export OUTLINE_API_URL=https://your-outline-instance.com/api

   # List all collections with their IDs
   npm run list-collections
   ```

2. **Via Outline URL**: Collection IDs are embedded in the URL when viewing a collection in Outline:

   **URL Format:** `https://your-outline.com/collection/collection-name-COLLECTION_ID`

   **Examples:**

   - `https://docs.company.com/collection/user-guides-abc123def` → Collection ID is `abc123def`
   - `https://docs.company.com/collection/team-docs-xyz789` → Collection ID is `xyz789`

   **How to extract:** The collection ID is everything after the last dash (`-`) in the URL path.

3. **Via API**: You can also list all collections to find their IDs:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        "https://your-outline.com/api/collections.list"
   ```

## 🔧 Configuration

### Environment Variables

| Variable               | Description                                           | Example                        |
| ---------------------- | ----------------------------------------------------- | ------------------------------ |
| `OPENAI_API_KEY`       | Your OpenAI API key                                   | `sk-...`                       |
| `OUTLINE_API_KEY`      | Your Outline API token                                | `ol_api_...`                   |
| `OUTLINE_API_URL`      | Your Outline API base URL                             | `https://docs.company.com/api` |
| `SOURCE_COLLECTION_ID` | Collection ID to translate from                       | `abc123...`                    |
| `TARGET_COLLECTION_ID` | Collection ID to create translations in               | `def456...`                    |
| `MAX_SPENDING_USD`     | Maximum spending limit (optional)                     | `10.00`                        |
| `BATCH_SIZE`           | Number of documents per batch (optional)              | `5`                            |
| `DRY_RUN`              | Translates first document only for testing (optional) | `true`                         |

### Translation Tracking

The tool creates a `translatedDocs.json` file to track translations:

```json
{
  "doc_id_123": {
    "originalId": "doc_id_123",
    "translatedId": "doc_id_456",
    "originalTitle": "Original Title",
    "translatedTitle": "Translated Title",
    "originalUpdatedAt": "2024-01-15T10:30:00.000Z",
    "translatedAt": "2024-01-15T15:45:00.000Z"
  }
}
```

**Enhanced Tracking Features:**

- **Folder Tracking**: Parent/folder documents are tracked to prevent duplicate creation
- **Hierarchy Awareness**: Tracks both leaf documents and intermediate folder documents
- **Order Independence**: Prevents duplicates regardless of processing order (deep → shallow or shallow → deep)
- **Resume Capability**: Can safely resume translation after interruption without creating duplicates

## 💰 Cost Control & Safety Features

### 🛡️ Spending Protection

The tool includes several safety mechanisms to protect against unexpected API costs:

#### 1. **Cost Estimation**

Before any translation starts, the tool estimates costs based on:

- Document content length
- Number of documents
- GPT-4o pricing ($2.50 per 1M input tokens, $10.00 per 1M output tokens)

#### 2. **Spending Limits**

Set a maximum spending limit to prevent runaway costs:

```bash
# Limit total spending to $10
MAX_SPENDING_USD=10.00
```

#### 3. **Batch Processing**

Control how many documents are translated at once:

```bash
# Translate only 5 documents per run
BATCH_SIZE=5
```

#### 4. **Dry Run Mode**

Test translations safely by translating only the first document:

```bash
# Dry run mode - translates first document only for testing
DRY_RUN=true
```

This mode:

- ✅ Translates the first document completely (real API call for testing)
- 🔍 Shows what would happen for remaining documents (no API calls)
- 💰 Incurs minimal cost (only for the first document)
- 📋 Provides accurate cost estimates for full batch
- 🌳 Tests folder structure creation and hierarchy replication
- 📁 Creates necessary parent folders with translated content for testing

### 💡 Cost Control Examples

**Safe First Run:**

```env
MAX_SPENDING_USD=1.00
BATCH_SIZE=3
DRY_RUN=true
```

**Production Setup:**

```env
MAX_SPENDING_USD=25.00
BATCH_SIZE=10
DRY_RUN=false
```

### 📊 Cost Monitoring

The tool provides detailed cost information:

- **Before translation:** Estimated cost and token usage
- **During translation:** Per-document cost tracking
- **After translation:** Total actual vs estimated costs

### 🚨 Safety Warnings

- **High Cost Alert:** Warns when estimated cost exceeds $10
- **Spending Limit Block:** Stops translation if it would exceed your limit
- **Usage Guidance:** Links to OpenAI usage dashboard for monitoring

### 💸 Typical Costs

Based on GPT-4o pricing (as of 2024):

- **Short document** (1-2 pages): ~$0.01-0.02
- **Medium document** (5-10 pages): ~$0.05-0.10
- **Long document** (20+ pages): ~$0.20-0.50

**Total costs depend on:**

- Number of documents
- Document length
- Content complexity
- Language being translated from

## 📁 Project Structure

```
outline-translate/
├── src/
│   ├── config/
│   │   └── index.ts              # Environment configuration
│   ├── services/
│   │   ├── outlineClient.ts      # Outline API client
│   │   ├── translationService.ts # OpenAI translation service with quote removal
│   │   ├── translationTracker.ts # Translation tracking and duplicate prevention
│   │   ├── documentHierarchy.ts  # Document tree analysis and folder structure replication
│   │   ├── costEstimator.ts      # Cost estimation and spending limits
│   │   └── usageMonitor.ts       # OpenAI usage monitoring and guidance
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── index.ts                  # Main application logic with hierarchy support
├── package.json
├── tsconfig.json
├── .env                          # Your environment variables
├── .env.example                 # Environment template
├── translatedDocs.json          # Translation tracking (auto-generated)
└── README.md
```

## 🔄 Update Detection

The tool can detect when original documents have been updated since their last translation:

- Compares `updatedAt` timestamp from Outline with stored translation date
- Automatically retranslates documents that have been modified
- Maintains translation history for audit purposes

## ⚙️ Advanced Usage

### Development Mode

```bash
# Run with auto-restart on file changes
npm run dev
```

### Collection Management

```bash
# List all collections to find IDs
npm run list-collections

# Extract collection ID from URL
npm run extract-id "https://your-outline.com/collection/my-docs-abc123"

# These only require OUTLINE_API_KEY and OUTLINE_API_URL (no OpenAI key needed)
```

### Build for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Run compiled version
node dist/index.js
```

### Cleaning Up

```bash
# Remove compiled files
npm run clean
```

## 🚨 Important Notes

### Rate Limiting

- The tool includes built-in delays (1 second between documents) to respect API rate limits
- Monitor your OpenAI usage to avoid unexpected costs
- Large wikis may take considerable time to translate

### Content Handling

- Documents without content are automatically skipped
- The tool attempts to detect if content is already in English to avoid unnecessary translations
- Markdown formatting, links, and code blocks are preserved during translation

### Error Recovery

- Individual document failures don't stop the entire process
- Detailed error logging helps identify and resolve issues
- Translation tracking allows resuming from where you left off

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors**

```bash
# Make sure dependencies are installed
npm install
```

**API authentication errors**

- Verify your API keys in the `.env` file
- Check that your Outline API token has the necessary permissions
- Ensure your OpenAI account has GPT-4o access

**Rate limiting issues**

- Increase the delay between requests in `src/index.ts`
- Consider running the tool during off-peak hours

**Only one document being translated**

- Check your `BATCH_SIZE` setting in `.env` - it might be set to 1
- Review `translatedDocs.json` - documents might already be translated from previous runs
- Look for "already translated and up-to-date" messages in the logs

**Duplicate folders or documents**

- The tool should prevent this automatically with hierarchy tracking
- If duplicates occur, try clearing `translatedDocs.json` and starting fresh
- Check logs for "Found existing translated folder" messages

**Quotes around translated titles**

- This should be automatically fixed by the quote removal feature
- If quotes persist, check that your `translationService.ts` includes the quote removal regex

**Folders not being translated**

- The tool now translates both folder names AND content
- Check logs for "Translating folder name" and "Created folder" messages
- Intermediate documents should appear as translated in the target collection

### Debug Information

The tool provides detailed logging:

- 📚 Document fetching progress with hierarchy information
- 🌳 Document tree structure analysis and statistics
- 🔍 Complete document discovery with parent-child relationships
- 📁 Folder structure creation and translation tracking
- 🌐 Translation status for both content and titles
- 📝 Document creation results with hierarchy positioning
- 🔄 Duplicate detection and prevention messages
- 📊 Final statistics with folder and document counts

## 📄 License

MIT License - feel free to modify and distribute as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Need help?** Check the logs for detailed error messages, or review the API documentation for [Outline](https://www.getoutline.com/developers) and [OpenAI](https://platform.openai.com/docs).
