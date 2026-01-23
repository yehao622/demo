import { GoogleGenAI } from "@google/genai";
import { Article } from "../../models/Article";

interface LabelingResult {
    topics: string[];
    organTypes: string[];
    categories: string[];
    confidence: number;
}

export class TopicLabeler {
    private genAI: GoogleGenAI;
    // private model: any;

    private readonly VALID_TOPICS = [
        'diabetes',
        'transplant',
        'kidney-disease',
        'liver-disease',
        'heart-disease',
        'lung-disease',
        'pancreas-disease',
        'dialysis',
        'organ-donation',
        'living-donation'
    ];

    private readonly VALID_ORGANS = [
        'kidney',
        'liver',
        'heart',
        'lung',
        'pancreas',
        'intestine',
        'bone-marrow'
    ];

    private readonly VALID_CATEGORIES = [
        'research',
        'patient-story',
        'legislation',
        'medical-breakthrough',
        'statistics',
        'awareness-campaign',
        'fundraising',
        'transplant-success',
        'donor-story',
        'healthcare-policy'
    ];

    constructor(apiKey: string) {
        this.genAI = new GoogleGenAI({ apiKey: apiKey });
        // this.model = this.genAI.models.get({ model: 'gemini-2.5-flash' });
    }

    /**
   * Label a single article with topics, organ types, and categories
   * Returns the labeled article (mutates the input article)
   */
    async labelArticle(article: Article): Promise<Article> {
        const prompt = this.buildPrompt(article);

        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = response.text;
            if (!text) {
                throw new Error('Empty response from Gemini API');
            }

            const labels = this.parseLabels(text);

            // Update article with labels
            article.topics = labels.topics;
            article.organTypes = labels.organTypes;
            article.categories = labels.categories;

            return article;
        } catch (error) {
            console.error(`Error labeling article ${article.id}:`, error);
            // Keep existing labels or use empty arrays
            article.topics = article.topics || [];
            article.organTypes = article.organTypes || [];
            article.categories = article.categories || [];
            return article;
        }
    }

    /**
   * Label multiple articles in batch
   * Returns array of labeled articles
   */
    async labelArticles(articles: Article[]): Promise<Article[]> {
        const labeledArticles: Article[] = [];

        // Process articles with rate limiting (avoid API throttling)
        for (const article of articles) {
            const labeled = await this.labelArticle(article);
            labeledArticles.push(labeled);

            // Add small delay between requests (200ms)
            await this.delay(200);
        }

        return labeledArticles;
    }

    // Build the prompt for Gemini API
    private buildPrompt(article: Article): string {
        return `You are an expert medical content classifier specializing in organ transplantation and donation.

        Analyze the following article and classify it with appropriate labels.

        **Article Title:** ${article.title}
        **Article Excerpt:** ${article.excerpt}
        **Article Content (first 500 chars):** ${article.content.substring(0, 500)}

        **Your task:**
        Assign relevant labels from the following categories:

        1. **Topics** (select all that apply):
        ${this.VALID_TOPICS.join(', ')}

        2. **Organ Types** (select all that apply):
        ${this.VALID_ORGANS.join(', ')}

        3. **Categories** (select all that apply):
        ${this.VALID_CATEGORIES.join(', ')}

        **Output Format (JSON only, no markdown):**
        {
        "topics": ["topic1", "topic2"],
        "organTypes": ["organ1"],
        "categories": ["category1"],
        "confidence": 0.95
        }

        **Rules:**
        - Only use labels from the provided lists above
        - Select 1-4 topics maximum
        - Select 0-2 organ types (only if explicitly mentioned)
        - Select 1-3 categories maximum
        - Confidence should be 0.0-1.0 based on how clear the article content is
        - Return valid JSON only, no additional text`;
    }

    // Parse Gemini response into LabelingResult
    private parseLabels(responseText: string): LabelingResult {
        try {
            // Remove markdown code blocks if present
            let jsonText = responseText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(jsonText);

            // Validate and filter labels
            return {
                topics: this.validateLabels(parsed.topics || [], this.VALID_TOPICS),
                organTypes: this.validateLabels(parsed.organTypes || [], this.VALID_ORGANS),
                categories: this.validateLabels(parsed.categories || [], this.VALID_CATEGORIES),
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
            };
        } catch (error) {
            console.error('Error parsing labels:', error);
            console.error('Response text:', responseText);
            // Fallback: try to extract labels using regex
            return this.fallbackParsing(responseText);
        }
    }

    // Validate labels against allowed values
    private validateLabels(labels: string[], validLabels: string[]): string[] {
        return labels
            .map(label => label.toLowerCase().trim())
            .filter(label => validLabels.includes(label));
    }

    // Fallback parsing if JSON parsing fails
    private fallbackParsing(text: string): LabelingResult {
        const topics = this.VALID_TOPICS.filter(topic =>
            text.toLowerCase().includes(topic)
        ).slice(0, 3);

        const organTypes = this.VALID_ORGANS.filter(organ =>
            text.toLowerCase().includes(organ)
        ).slice(0, 2);

        const categories = this.VALID_CATEGORIES.filter(category =>
            text.toLowerCase().includes(category)
        ).slice(0, 2);

        return {
            topics,
            organTypes,
            categories,
            confidence: 0.3 // Low confidence for fallback parsing
        };
    }

    // Delay helper for rate limiting
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get statistics about labeled articles
    getStatistics(articles: Article[]): {
        totalArticles: number;
        labeledArticles: number;
        unlabeledArticles: number;
        topicDistribution: Record<string, number>;
        organDistribution: Record<string, number>;
        categoryDistribution: Record<string, number>;
        allTopics: string[],
        allOrgans: string[],
        allCategories: string[]
    } {
        const labeled = articles.filter(a => a.topics && a.topics.length > 0);
        const unlabeled = articles.filter(a => !a.topics || a.topics.length === 0);
        const topicDist: Record<string, number> = {};
        const organDist: Record<string, number> = {};
        const categoryDist: Record<string, number> = {};

        for (const article of labeled) {
            article.topics.forEach(topic => {
                topicDist[topic] = (topicDist[topic] || 0) + 1;
            });

            article.organTypes.forEach(organ => {
                organDist[organ] = (organDist[organ] || 0) + 1;
            });

            article.categories.forEach(category => {
                categoryDist[category] = (categoryDist[category] || 0) + 1;
            });
        }

        // Extract unique arrays from distributions
        const allTopics = Object.keys(topicDist).sort();
        const allOrgans = Object.keys(organDist).sort();
        const allCategories = Object.keys(categoryDist).sort();

        return {
            totalArticles: articles.length,
            labeledArticles: labeled.length,
            unlabeledArticles: unlabeled.length,
            topicDistribution: topicDist,
            organDistribution: organDist,
            categoryDistribution: categoryDist,
            allTopics,
            allOrgans,
            allCategories
        };
    }
}