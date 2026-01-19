import express, { Request, Response } from 'express';
import { DailyDiabetesCrawler } from '../services/crawler/DailyDiabetesCrawler';
import { Article } from '../models/Article';

const router = express.Router();

// In-memory storage for demo (replace with database in production)
const articles: Article[] = [];

/**
 * POST /api/content/crawl
 * Trigger crawling for DailyDiabetesNews
 */
router.post('/crawl', async (req: Request, res: Response) => {
    try {
        const { maxArticles = 5 } = req.body;

        console.log(`\n[API] Starting crawl with max ${maxArticles} articles...`);

        const crawler = new DailyDiabetesCrawler();

        // Step 1: Get article links
        const links = await crawler.crawlIndex();
        const linksToProcess = links.slice(0, maxArticles);

        console.log(`[API] Processing ${linksToProcess.length} articles...`);

        // Step 2: Crawl each article
        const crawledArticles: Article[] = [];
        const errors: string[] = [];

        for (const link of linksToProcess) {
            console.log(`[API] Crawling article ${crawledArticles.length + 1}/${linksToProcess.length}...`);

            try {
                const article = await crawler.crawlArticle(link);
                crawledArticles.push(article);
                articles.push(article); // Store in memory

                // Polite crawling: wait 1 second between requests
                await sleep(5000);
            } catch (error) {
                const errorMsg = `Failed to crawl ${link}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`[API] ${errorMsg}`);
                errors.push(errorMsg);
            }
        }

        console.log(`[API] ✓ Crawl completed: ${crawledArticles.length} successful, ${errors.length} failed\n`);

        res.json({
            success: true,
            articlesCount: crawledArticles.length,
            totalStoredArticles: articles.length,
            articles: crawledArticles.map(a => ({
                id: a.id,
                title: a.title,
                url: a.url,
                excerpt: a.excerpt,
                publishDate: a.publishDate,
                crawledAt: a.crawledAt,
            })),
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('[API] Crawl failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Crawl failed',
        });
    }
});

/**
 * GET /api/content/articles
 * Get all stored articles
 */
router.get('/articles', (req: Request, res: Response) => {
    res.json({
        success: true,
        count: articles.length,
        articles: articles.map(a => ({
            id: a.id,
            source: a.source,
            title: a.title,
            url: a.url,
            excerpt: a.excerpt,
            publishDate: a.publishDate,
            crawledAt: a.crawledAt,
            topics: a.topics,
            organTypes: a.organTypes,
            categories: a.categories,
        })),
    });
});

/**
 * GET /api/content/articles/:id
 * Get full article content by ID
 */
router.get('/articles/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const article = articles.find(a => a.id === id);

    if (!article) {
        return res.status(404).json({
            success: false,
            error: 'Article not found',
        });
    }

    res.json({
        success: true,
        article,
    });
});

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
