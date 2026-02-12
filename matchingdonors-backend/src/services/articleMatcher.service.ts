import { GoogleGenAI } from '@google/genai';
import { Article } from '../models/Article';

// Search request parameters
export interface ArticleSearchRequest {
    query: string;
    topN?: number;
    minSimilarity?: number;
}

// Article embedding with metadata
export interface ArticleEmbedding {
    articleId: string;
    embedding: number[];
    timestamp: Date;
}

// Article match result and relevance score
export interface ArticleMatchResult {
    article: Article;
    similarity: number;
    rank: number;
}

// Search response with AI summary
export interface ArticleSearchResponse {
    query: string;
    summary: string;
    matches: ArticleMatchResult[];
    queryAnalysis: {
        extractedOrgans: string[];
        extractedTopics: string[];
        intent: string;
    };
}

/**
 * Provides semantic search for articles using Google Gemini AI embeddings.
 * Implements "Hybrid Search" (Vector Recall + LLM Re-ranking).
 */
export class ArticleMatcherService {
    private genAI: GoogleGenAI;
    private embeddingModel: string = 'gemini-embedding-001';
    private generationModel: string = 'gemini-2.5-flash';

    // In-memory storage (replace with database in production)
    private embeddings: Map<string, ArticleEmbedding> = new Map();
    private articles: Map<string, Article> = new Map();

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        this.genAI = new GoogleGenAI({ apiKey });
    }

    // --- Core Vector Logic ---

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: text,
            });
            return response.embeddings?.[0]?.values || [];
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error('Failed to generate embedding');
        }
    }

    async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: texts,
            });
            return response.embeddings?.map(e => e.values || []) || [];
        } catch (error) {
            console.error('Error generating batch embeddings:', error);
            throw new Error('Failed to generate batch embeddings');
        }
    }

    computeSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            const valA = vecA[i];
            const valB = vecB[i];
            
            if (valA !== undefined && valB !== undefined) {
                dot += valA * valB;
                normA += valA * valA;
                normB += valB * valB;
            }
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    // --- Storage ---

    async storeArticle(article: Article): Promise<void> {
        const text = this.buildArticleText(article);
        const embedding = await this.generateEmbedding(text);
        this.articles.set(article.id, article);
        this.embeddings.set(article.id, { articleId: article.id, embedding, timestamp: new Date() });
    }

    async storeArticlesBatch(articles: Article[]): Promise<void> {
        const texts = articles.map(a => this.buildArticleText(a));
        const embeddings = await this.generateEmbeddingsBatch(texts);
        articles.forEach((article, index) => {
            const embedding = embeddings[index];
            if (embedding && embedding.length > 0) {
                this.articles.set(article.id, article);
                this.embeddings.set(article.id, { articleId: article.id, embedding, timestamp: new Date() });
            }
        });
        console.log(`✓ Indexed ${articles.length} articles.`);
    }

    // --- The RAG / Re-ranking Logic ---

    async rerankResults(query: string, candidates: ArticleMatchResult[]): Promise<ArticleMatchResult[]> {
        if (candidates.length <= 1) return candidates;

        const candidateContext = candidates.map((c, idx) => 
            `ID: ${idx}\nTitle: ${c.article.title}\nSource: ${c.article.source}\nExcerpt: ${c.article.excerpt}`
        ).join('\n\n');

        // IMPROVED PROMPT: Explicitly handles "Only from X" and variable renaming
        const prompt = `
        You are a search ranking expert.
        User Query: "${query}"
        
        Task: 
        1. Analyze the user's query for constraints.
           - Negative constraints: "not from X", "ignore Y" -> Score these 0.0.
           - Positive constraints: "only from X", "source must be Y" -> Score non-matching sources 0.0.
           - Quantity constraints: "only 3 articles", "top 5" -> Strictly return only that many items in the JSON array.
        2. Review Candidate Articles and assign a "relevanceScore" (0.00 to 0.99).
           - 0.90+: Perfect match.
           - 0.00: Violates constraints or irrelevant.
        
        Candidate Articles:
        ${candidateContext}

        Return a JSON object:
        {
            "rankedResults": [
                { "id": number, "score": number }
            ]
        }
        
        IMPORTANT RULES:
        - Return ONLY JSON.
        - Filter out items with score 0.
        - If the user asked for a specific number (e.g. "3 articles"), the 'rankedResults' array MUST NOT contain more than that number of items.
        - Sort by score descending.
        `;

        try {
            const result = await this.genAI.models.generateContent({
                model: this.generationModel,
                contents: prompt
            });

            let text = result.text || '';
            const firstOpen = text.indexOf('{');
            const lastClose = text.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                text = text.substring(firstOpen, lastClose + 1);
            } else {
                return candidates;
            }

            const parsed = JSON.parse(text);
            
            // FIX: Changed 'rankedIndices' to 'rankedResults' to match the Prompt request
            if (parsed.rankedResults && Array.isArray(parsed.rankedResults)) {
                const reranked: ArticleMatchResult[] = [];
                
                parsed.rankedResults.forEach((item: any) => {
                    const match = candidates[item.id];
                    if (match) {
                        // Use AI score directly
                        match.similarity = item.score; 
                        reranked.push(match);
                    }
                });

                // Fallback: If AI returned nothing but input had candidates (and it wasn't a strict filter), return top 3
                // But if strict filter (score 0), returning empty is correct.
                if (reranked.length === 0 && candidates.length > 0) {
                     // Check if query implies strict filtering to decide if we should fallback or return 0
                     if (query.toLowerCase().includes('only') || query.toLowerCase().includes('not')) {
                        return []; // Correctly return nothing if nothing matched strict criteria
                     }
                     return candidates.slice(0, 3); 
                }

                return reranked;
            }
            return candidates; 
        } catch (error) {
            console.error('Re-ranking failed, using vector order:', error);
            return candidates;
        }
    }

    // --- Main Search Function ---

    async searchArticles(request: ArticleSearchRequest): Promise<ArticleSearchResponse> {
        const { query, topN = 10 } = request;

        const queryEmbedding = await this.generateEmbedding(query);
        const initialCandidates: ArticleMatchResult[] = [];
        const recallLimit = topN * 3; 

        for (const [id, embData] of this.embeddings.entries()) {
            const article = this.articles.get(id);
            if (!article) continue;
            const similarity = this.computeSimilarity(queryEmbedding, embData.embedding);
            
            if (similarity >= 0.25) { 
                initialCandidates.push({
                    article,
                    similarity,
                    rank: 0
                });
            }
        }

        initialCandidates.sort((a, b) => b.similarity - a.similarity);
        
        // Pass top candidates to AI for re-ranking
        const candidatesForReranking = initialCandidates.slice(0, recallLimit);
        const finalResults = await this.rerankResults(query, candidatesForReranking);

        // Final Slice (respects AI's filtering if AI returned fewer than topN)
        const topMatches = finalResults.slice(0, topN);

        // Assign final ranks
        topMatches.forEach((match, index) => {
            match.rank = index + 1;
        });

        const summary = await this.generateSummary(query, topMatches);
        
        return {
            query,
            summary,
            matches: topMatches,
            queryAnalysis: {
                extractedOrgans: [],
                extractedTopics: [],
                intent: query
            }
        };
    }

    // --- Helpers ---

    async generateSummary(query: string, matches: ArticleMatchResult[]): Promise<string> {
        if (matches.length === 0) return "No relevant articles found.";
        
        const context = matches.slice(0, 3).map((m, i) => 
            `Source ${i+1}. ${m.article.title}: ${m.article.excerpt}`
        ).join('\n\n');

        const prompt = `
        Based on the provided articles, answer the user's question: "${query}"
        
        Structure your response exactly like this:
        
        **Direct Answer:**
        [A concise 1-2 sentence direct answer]

        **Key Insights:**
        • [Key point 1 from articles]
        • [Key point 2 from articles]
        • [Key point 3 from articles]
        
        Articles for context:
        ${context}
        `;
        
        try {
            const result = await this.genAI.models.generateContent({
                model: this.generationModel,
                contents: prompt
            });
            return result.text || '';
        } catch (e) {
            return 'Summary unavailable.';
        }
    }

    private buildArticleText(article: Article): string {
        return `${article.title} ${article.excerpt} ${article.topics.join(' ')} ${article.organTypes.join(' ')}`.trim();
    }

    getStats() { return { articleCount: this.articles.size, embeddingCount: this.embeddings.size }; }
    clearAll() { this.articles.clear(); this.embeddings.clear(); }
}