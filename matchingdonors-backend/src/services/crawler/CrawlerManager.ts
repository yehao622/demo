import { BaseCrawler } from "./BaseCrawler";
import { DailyDiabetesCrawler } from "./DailyDiabetesCrawler";
import { DailyTransplantCrawler } from "./DailyTransplantCrawler";
import { IrishTransplantCrawler } from "./IrishTransplantCrawler";
import { MatchingDonorsCrawler } from "./MatchingDonorsCrawler";
import { Article } from "../../models/Article";

/**
 * CrawlerManager - Centralized management for all site crawlers
 * 
 * Key responsibilities:
 * 1. Register all crawler instances
 * 2. Orchestrate crawling across single or multiple sites
 * 3. Manage crawl rate limiting (polite crawling)
 * 4. Store and filter crawled articles
 */
export class CrawlerManager {
    private crawlers: Map<string, BaseCrawler>;
    private articles: Article[] = [];

    constructor() {
        this.crawlers = new Map<string, BaseCrawler>([
            ['dailydiabetes', new DailyDiabetesCrawler()],
            ['dailytransplant', new DailyTransplantCrawler()],
            ['irishtransplant', new IrishTransplantCrawler()],
            ['matchingdonors', new MatchingDonorsCrawler()],
        ]);
    }

    /**
     * 
     * @param siteName - Site identifier (e.g., 'dailydiabetes')
     * @param maxArticles - Maximum number of articles to crawl
     * @returns Array of successfully crawled articles
     * 1. Get crawler instance for the site
     * 2. Fetch article links from index page
     * 3. Crawl individual articles (up to maxArticles)
     * 4. Wait between requests to be polite to the server
     */
    async crawlSite(siteName: string, maxArticles: number = 10): Promise<Article[]> {
        const crawler = this.crawlers.get(siteName);
        if (!crawler) {
            throw new Error(`Unknown site: ${siteName}. Available sites: ${[...this.crawlers.keys()].join(', ')}`);
        }

        console.log(`[CrawlerManager] Starting crawl of ${siteName}...`);

        // Step 1. Get article links from index page
        const links = await crawler.crawlIndex();
        console.log(`[CrawlerManager] Found ${links.length} article links`);

        // Step 2. Crawl individual articles 
        const articlesToCrawl = links.slice(0, maxArticles);
        const articles: Article[] = [];

        for (const link of articlesToCrawl) {
            try {
                const article = await crawler.crawlArticle(link);
                articles.push(article);
                console.log(`[Crawler] crawled ${article.title}`);

                // wait 5 second between request
                await this.sleep(5000);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[CrawlerManager] ✗ Failed to crawl ${link}:`, errorMessage);
            }
        }

        this.articles.push(...articles);
        console.log(`[Crawler] Completed. Crawled ${articles.length}/${articlesToCrawl} articles from ${siteName}`);

        return articles;
    }

    /**
     * 
     * @param maxArticlesPerSite - Max articles to crawl per site
     * @returns Combined array of all crawled articles
     * Use case: Bulk content refresh across all news sources
     */
    async crawlAllSites(maxArticlesPerSite: number = 5): Promise<Article[]> {
        const allArticles: Article[] = [];
        const siteNames = [...this.crawlers.keys()];
        console.log(`\n[CrawlerManager] Starting crawl of ${siteNames.length} sites (${maxArticlesPerSite} articles each)...`);

        for (const siteName of siteNames) {
            try {
                const articles = await this.crawlSite(siteName, maxArticlesPerSite);
                allArticles.push(...articles);
                await this.sleep(2000);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[CrawlerManager] Failed to crawl ${siteName}:`, errorMessage);
            }
        }

        console.log(`[CrawlerManager] All sites completed. Total articles: ${allArticles.length}\n`);
        return allArticles;
    }

    /**
     * Get stored articles with optional filtering
     * @param filters - Optional filters for source, topics
     * @returns Filtered article array
     */
    getArticles(filters?: { source?: string; topics?: string[] }): Article[] {
        let filtered = [...this.articles];

        if (filters?.source) {
            filtered = filtered.filter(a => a.source === filters.source);
        }

        if (filters?.topics?.length) {
            filtered = filtered.filter(a =>
                a.topics.some(t => filters.topics!.includes(t))
            );
        }

        return filtered;
    }

    /**
     * Get available site names
     * @returns Array of registered site identifiers
     */
    getAvailableSites(): string[] {
        return [...this.crawlers.keys()];
    }

    // Clear all stored articles (useful for testing)
    clearArticles(): void {
        this.articles = [];
        console.log('[CrawlerManager] Article storage cleared');
    }

    /**
     * Polite delay between requests
     * @param ms - Milliseconds to wait
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}