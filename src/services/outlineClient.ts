import fetch, { RequestInit } from "node-fetch";
import {
  OutlineDocument,
  OutlineDocumentsListResponse,
  OutlineDocumentInfoResponse,
  OutlineDocumentCreateRequest,
  OutlineDocumentCreateResponse,
  Config,
} from "../types";

export class OutlineClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: Config) {
    this.apiKey = config.outlineApiKey;
    this.baseUrl = config.outlineApiUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Merge any additional headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          if (key && value) {
            headers[key] = value;
          }
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Outline API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getAllDocuments(): Promise<OutlineDocument[]> {
    console.log("📚 Fetching all documents from Outline...");

    const documents: OutlineDocument[] = [];
    let offset = 0;
    const limit = 100; // Outline API default limit

    do {
      const response = await this.makeRequest<OutlineDocumentsListResponse>(
        `/documents.list?offset=${offset}&limit=${limit}`,
        {
          method: "POST",
        }
      );

      documents.push(...response.data);

      console.log(
        `   Retrieved ${response.data.length} documents (total: ${documents.length})`
      );

      // If we got fewer documents than the limit, we've reached the end
      if (response.data.length < limit) {
        break;
      }

      offset += limit;
    } while (true);

    console.log(
      `✅ Retrieved ${documents.length} total documents from Outline`
    );
    return documents;
  }

  async getDocumentsByCollection(
    collectionId: string
  ): Promise<OutlineDocument[]> {
    console.log(`📚 Fetching documents from collection: ${collectionId}`);

    const documents: OutlineDocument[] = [];
    let offset = 0;
    const limit = 100; // Outline API default limit

    do {
      const response = await this.makeRequest<OutlineDocumentsListResponse>(
        `/documents.list?offset=${offset}&limit=${limit}`,
        {
          method: "POST",
          body: JSON.stringify({ collectionId: collectionId }),
        }
      );

      documents.push(...response.data);

      console.log(
        `   Retrieved ${response.data.length} documents from collection (total: ${documents.length})`
      );

      // If we got fewer documents than the limit, we've reached the end
      if (response.data.length < limit) {
        break;
      }

      offset += limit;
    } while (true);

    console.log(
      `✅ Retrieved ${documents.length} total documents from collection ${collectionId}`
    );
    return documents;
  }

  async getCollections(): Promise<any[]> {
    console.log("📁 Fetching collections from Outline...");

    const response = await this.makeRequest<any>("/collections.list", {
      method: "POST",
    });

    console.log(`✅ Retrieved ${response.data.length} collections`);
    return response.data;
  }

  async getDocumentInfo(documentId: string): Promise<OutlineDocument> {
    console.log(`📄 Fetching document info for ID: ${documentId}`);

    const response = await this.makeRequest<OutlineDocumentInfoResponse>(
      `/documents.info`,
      {
        method: "POST",
        body: JSON.stringify({ id: documentId }),
      }
    );

    return response.data;
  }

  async createDocument(
    request: OutlineDocumentCreateRequest
  ): Promise<OutlineDocument> {
    console.log(`📝 Creating new document: ${request.title}`);

    const response = await this.makeRequest<OutlineDocumentCreateResponse>(
      `/documents.create`,
      {
        method: "POST",
        body: JSON.stringify({
          ...request,
          publish: true, // Auto-publish the translated document
        }),
      }
    );

    console.log(`✅ Created document with ID: ${response.data.id}`);
    return response.data;
  }

  async documentExists(title: string, collectionId: string): Promise<boolean> {
    try {
      // Search for documents with the specific title in the collection
      const response = await this.makeRequest<OutlineDocumentsListResponse>(
        `/documents.list`,
        {
          method: "POST",
          body: JSON.stringify({ id: collectionId }),
        }
      );

      return response.data.some((doc) => doc.title === title);
    } catch (error) {
      console.warn(`Warning: Could not check if document exists: ${error}`);
      return false;
    }
  }
}
