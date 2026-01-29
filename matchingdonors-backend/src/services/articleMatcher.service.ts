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
    relevanceReason: string;
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
 * Similar to MatchingService but optimized for article content discovery.
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

    // Generate embedding vector for text
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: text,
            });

            if (!response.embeddings || response.embeddings.length === 0) {
                throw new Error('No embeddings returned from API');
            }

            const embedding = response.embeddings[0];

            if (!embedding || !embedding.values || embedding.values.length === 0) {
                throw new Error('Empty embedding values returned');
            }

            return embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Generate embeddings for multiple texts (batch processing)
    async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: texts,
            });

            if (!response.embeddings || response.embeddings.length === 0) {
                throw new Error('No embeddings returned from API');
            }

            const embeddings: number[][] = [];

            for (let index = 0; index < response.embeddings.length; index++) {
                const emb = response.embeddings[index];

                if (!emb || !emb.values || emb.values.length === 0) {
                    throw new Error(`Empty embedding values at index ${index}`);
                }

                embeddings.push(emb.values);
            }

            return embeddings;
        } catch (error) {
            console.error('Error generating batch embeddings:', error);
            throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Compute cosine similarity between two vectors
    computeSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB) {
            throw new Error('Invalid vectors: vectors cannot be null or undefined');
        }

        if (vecA.length !== vecB.length) {
            throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            const a = vecA[i];
            const b = vecB[i];

            if (a === undefined || b === undefined) {
                throw new Error(`Undefined value at index ${i}`);
            }

            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    // Store article with its embedding
    async storeArticle(article: Article): Promise<void> {
        try {
            const articleText = this.buildArticleText(article);
            const embedding = await this.generateEmbedding(articleText);

            this.articles.set(article.id, article);
            this.embeddings.set(article.id, {
                articleId: article.id,
                embedding,
                timestamp: new Date()
            });

            console.log(`✓ Stored article ${article.id} with embedding dimension: ${embedding.length}`);
        } catch (error) {
            console.error(`Failed to store article ${article.id}:`, error);
            throw error;
        }
    }

    // Store multiple articles with embeddings (batch)
    async storeArticlesBatch(articles: Article[]): Promise<void> {
        try {
            const articleTexts = articles.map(a => this.buildArticleText(a));
            const embeddings = await this.generateEmbeddingsBatch(articleTexts);

            articles.forEach((article, index) => {
                const embedding = embeddings[index];

                if (!embedding) {
                    throw new Error(`Missing embedding for article ${article.id} at index ${index}`);
                }

                this.articles.set(article.id, article);
                this.embeddings.set(article.id, {
                    articleId: article.id,
                    embedding,
                    timestamp: new Date()
                });
            });

            console.log(`✓ Stored ${articles.length} articles in batch`);
        } catch (error) {
            console.error('Failed to store articles in batch:', error);
            throw error;
        }
    }

    // Analyze search query using Gemini AI
    async analyzeQuery(query: string): Promise<{
        extractedOrgans: string[];
        extractedTopics: string[];
        intent: string;
    }> {
        try {
            const prompt = `Analyze this medical/transplant-related search query and extract key information:
                        Query: "${query}"

                        Provide a JSON response with:
                            1. extractedOrgans: List of organ types mentioned (kidney, liver, heart, lung, pancreas, intestine, marrow)
                            2. extractedTopics: Key medical topics or themes (e.g., "post-surgery care", "complications", "donor requirements", "technology")
                            3. intent: Brief description of what the user is looking for (1-2 sentences)

                        Return ONLY valid JSON, no markdown formatting.`;

            const result = await this.genAI.models.generateContent({
                model: this.generationModel,
                contents: prompt
            });

            const responseText = result.text || '';

            // Remove markdown code block if present
            const cleanedText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const analysis = JSON.parse(cleanedText);

            return {
                extractedOrgans: analysis.extractedOrgans || [],
                extractedTopics: analysis.extractedTopics || [],
                intent: analysis.intent || 'General information search'
            };
        } catch (error) {
            console.error('Error analyzing query:', error);
            // Return default analysis if AI fails
            return {
                extractedOrgans: this.extractOrgansSimple(query),
                extractedTopics: [],
                intent: 'General medical information search'
            };
        }
    }

    // Simple organ extraction fallback
    private extractOrgansSimple(text: string): string[] {
        const organs: string[] = [];
        const lower = text.toLowerCase();

        if (lower.includes('kidney')) organs.push('kidney');
        if (lower.includes('liver')) organs.push('liver');
        if (lower.includes('heart')) organs.push('heart');
        if (lower.includes('lung')) organs.push('lung');
        if (lower.includes('pancreas')) organs.push('pancreas');
        if (lower.includes('intestine')) organs.push('intestine');
        if (lower.includes('marrow') || lower.includes('bone marrow')) organs.push('marrow');

        return organs;
    }

    // Generative AI summary from top matching articles
    async generateSummary(query: string, matches: ArticleMatchResult[]): Promise<string> {
        try {
            if (matches.length === 0) {
                return "No relevant articles found for your query. Please try different search terms.";
            }

            // Build context from top 3 articles
            const contextArticles = matches.slice(0, 3).map((match, idx) => {
                return `Article ${idx + 1}: ${match.article.title}
                        Summary: ${match.article.excerpt}
                        Key points: ${match.article.content.substring(0, 300)}...`;
            }).join('\n\n');

            const prompt = `Based on the following medical articles, provide a comprehensive answer to this question:
                        Question: "${query}"
                        Articles: ${contextArticles}

                        Provide a clear, concise answer (3-4 sentences) that:
                            1. Directly addresses the question
                            2. Synthesizes information from the articles
                            3. Uses professional medical language
                            4. Highlights key points or recommendations
                        Answer:`;

            const result = await this.genAI.models.generateContent({
                model: this.generationModel,
                contents: prompt
            });

            return result.text || '';
        } catch (error) {
            console.error('Error generating summary:', error);
            return `Found ${matches.length} relevant article${matches.length !== 1 ? 's' : ''} about your query. Please review the articles below for detailed information.`;
        }
    }

    // Search articles by query
    async searchArticles(request: ArticleSearchRequest): Promise<ArticleSearchResponse> {
        const { query, topN = 10, minSimilarity = 0.3 } = request;

        // Analyze query with AI
        const queryAnalysis = await this.analyzeQuery(query);

        // Generate embedding for query
        const queryEmbedding = await this.generateEmbedding(query);

        // Calculate similarities with all articles
        const matches: ArticleMatchResult[] = [];

        for (const [id, embData] of this.embeddings.entries()) {
            const article = this.articles.get(id);
            if (!article) continue;

            // Calculate semantic similarity
            const similarity = this.computeSimilarity(queryEmbedding, embData.embedding);

            // Boost score if query organs/topics match article labels
            let boostedSimilarity = similarity;

            if (queryAnalysis.extractedOrgans.length > 0) {
                const organMatch = queryAnalysis.extractedOrgans.some(organ =>
                    article.organTypes.some(articleOrgan =>
                        articleOrgan.toLowerCase().includes(organ.toLowerCase())
                    )
                );
                if (organMatch) boostedSimilarity += 0.1;
            }

            if (queryAnalysis.extractedTopics.length > 0) {
                const topicMatch = queryAnalysis.extractedTopics.some(topic =>
                    article.topics.some(articleTopic =>
                        articleTopic.toLowerCase().includes(topic.toLowerCase()) ||
                        topic.toLowerCase().includes(articleTopic.toLowerCase())
                    )
                );
                if (topicMatch) boostedSimilarity += 0.05;
            }

            // Cap boosted similarity at 1.0
            boostedSimilarity = Math.min(boostedSimilarity, 1.0);

            if (boostedSimilarity >= minSimilarity) {
                matches.push({
                    article,
                    similarity: boostedSimilarity,
                    rank: 0, // Will be set after sorting
                    relevanceReason: this.generateRelevanceReason(article, queryAnalysis)
                });
            }
        }

        // Sort by similarity and assign ranks
        matches.sort((a, b) => b.similarity - a.similarity);
        matches.forEach((match, index) => {
            match.rank = index + 1;
        });

        // Take top N results
        const topMatches = matches.slice(0, topN);

        // Generate AI summary
        const summary = await this.generateSummary(query, topMatches);

        return {
            query,
            summary,
            matches: topMatches,
            queryAnalysis
        };
    }

    // generate relevance reason for article
    private generateRelevanceReason(article: Article, queryAnalysis: {
        extractedOrgans: string[];
        extractedTopics: string[];
        intent: string;
    }): string {
        const reasons: string[] = [];

        // Check organ matches
        if (queryAnalysis.extractedOrgans.length > 0) {
            const matchedOrgans = queryAnalysis.extractedOrgans.filter(organ =>
                article.organTypes.some(articleOrgan =>
                    articleOrgan.toLowerCase().includes(organ.toLowerCase())
                )
            );
            if (matchedOrgans.length > 0) {
                reasons.push(`Covers ${matchedOrgans.join(', ')}`);
            }
        }

        // Check topic matches
        if (article.topics.length > 0) {
            reasons.push(`Topics: ${article.topics.slice(0, 2).join(', ')}`);
        }

        // Check category
        if (article.categories.length > 0 && article.categories[0]) {
            reasons.push(article.categories[0]);
        }

        // Default if no specific reasons
        if (reasons.length === 0) {
            reasons.push('Semantically relevant');
        }

        return reasons.join(' • ');
    }

    // Build searchable text from article
    private buildArticleText(article: Article): string {
        return `
            Title: ${article.title}
            Excerpt: ${article.excerpt}
            Content: ${article.content}
            Topics: ${article.topics.join(', ')}
            Organs: ${article.organTypes.join(', ')}
            Categories: ${article.categories.join(', ')}
        `.trim();
    }

    // Get statistics
    getStats(): { articleCount: number; embeddingCount: number } {
        return {
            articleCount: this.articles.size,
            embeddingCount: this.embeddings.size
        };
    }

    // Clear all stored data (for testing)
    clearAll(): void {
        this.articles.clear();
        this.embeddings.clear();
        console.log('✓ Cleared all articles and embeddings');
    }

    // Remove duplicate articles based on title similarity
    async removeDuplicates(articles: Article[]): Promise<Article[]> {
        // TODO: Implement duplicate detection using title embeddings
        // For now, use simple title-based deduplication
        const seen = new Set<string>();
        return articles.filter(article => {
            const normalizedTitle = article.title.toLowerCase().trim();
            if (seen.has(normalizedTitle)) {
                return false;
            }
            seen.add(normalizedTitle);
            return true;
        });
    }
}