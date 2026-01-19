import { BaseCrawler } from "./BaseCrawler";
import { DailyDiabetesCrawler } from "./DailyDiabetesCrawler";
import { DailyTransplantCrawler } from ./ DailyTransplantCrawler;
import { IrishTransplantCrawler } from ./ IrishTransplantCrawler;
import { MatchingDonorsCrawler } from ./ MatchingDonorsCrawler;
import { Article } from "../../models/Article";
import { resolve } from "node:dns";

export class CrawlerManager {
    private crawlers: Map<string, BaseCrawler>;
    private articles: Article[] = [];

    constructor() {
        this.crawlers = new Map([
            ['dailydiabetes', new DailyDiabetesCrawler()],
            ['dailytransplant', new DailyTransplantCrawler()],
            ['irishtransplant', new IrishTransplantCrawler()],
            ['matchingdonors', new MatchingDonorsCrawler()],
        ]);
    }

    async crawSite(siteName: string, maxArticles: number = 10): Promise<Article[]> {
        const crawler = this.crawlers.get(siteName);
        if (!crawler) {
            throw new Error(`Unknown site: ${siteName}`);
        }

        console.log(`[Crawler] Starting crawl of ${siteName}...`);

        // Step 1. Get article links from index page
        const links = await crawler.crawlIndex();

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
                console.error(`[Crawler] failed to crawl ${link}:`, error.message);
            }
        }

        this.articles.push(...articles);
        console.log(`[Crawler] Completed. Crawled ${articles.length} articles from ${siteName}`);

        return articles;
    }

    async crawlAllSites(maxArticlesPerSite: number = 5): Promise<Article[]> {
        const allArticles: Article[] = [];

        for (const siteName of this.crawlers.keys()) {
            try {
                const articles = await this.crawSite(siteName, maxArticlesPerSite);
                allArticles.push(...articles);
            } catch (error) {
                console.error(`[Crawler] Failed to crawl ${siteName}:`, error.message);
            }
        }

        return allArticles;
    }

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

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}