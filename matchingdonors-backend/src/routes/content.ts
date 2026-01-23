import express, { Request, Response } from 'express';
import { Article } from '../models/Article';
import { CrawlerManager } from '../services/crawler/CrawlerManager';
import { TopicLabeler } from '../services/labeler/topicLabeler';

const router = express.Router();

// Initialize CrawlerManager (singleton pattern)
const crawlerManager = new CrawlerManager();

// In-memory storage for demo (replace with database in production)
const articles: Article[] = [];

// Initialize TopicLabeler (after crawlerManager initialization)
const topicLabeler = new TopicLabeler(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/content/crawl
 * Trigger crawling for DailyDiabetesNews
 * Request body:
 * - site?: string (e.g., 'dailydiabetes', 'dailytransplant', 'irishtransplant', 'matchingdonors')
 * - maxArticles?: number (default: 5)
 * - crawlAll?: boolean (crawl all sites)
 */
router.post('/crawl', async (req: Request, res: Response) => {
    try {
        const { site, maxArticles = 5, crawlAll = false } = req.body;

        console.log(`\n[API] Crawl request: ${crawlAll ? 'ALL SITES' : site || 'NO SITE SPECIFIED'}, max ${maxArticles} articles`);

        let crawledArticles: Article[] = [];
        const errors: string[] = [];

        if (crawlAll) {
            // Crawl all sites
            console.log('[API] Starting crawl of all sites...');
            crawledArticles = await crawlerManager.crawlAllSites(maxArticles);
        } else if (site) {
            // Crawl specific site
            const availableSites = crawlerManager.getAvailableSites();
            if (!availableSites.includes(site)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid site. Available sites: ${availableSites.join(', ')}`,
                });
            }

            console.log(`[API] Starting crawl of ${site}...`);
            crawledArticles = await crawlerManager.crawlSite(site, maxArticles);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Please specify "site" parameter or set "crawlAll" to true',
                availableSites: crawlerManager.getAvailableSites(),
            });
        }

        // Store articles
        articles.push(...crawledArticles);
        console.log(`[API] ✓ Crawl completed: ${crawledArticles.length} articles\n`);

        res.json({
            success: true,
            articlesCount: crawledArticles.length,
            totalStoredArticles: articles.length,
            articles: crawledArticles.map(a => ({
                id: a.id,
                source: a.source,
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
 * GET /api/content/sites
 * Get list of available sites to crawl
 */
router.get('/sites', (req: Request, res: Response) => {
    res.json({
        success: true,
        sites: crawlerManager.getAvailableSites(),
    });
});

/**
 * GET /api/content/articles
 * Get all stored articles
* - source?: string (filter by source)
 * - topics?: string (comma-separated topics)
 */
router.get('/articles', (req: Request, res: Response) => {
    const { source, topics } = req.query;

    let filtered = [...articles];

    if (source && typeof source === 'string') {
        filtered = filtered.filter(a => a.source === source);
    }

    if (topics && typeof topics === 'string') {
        const topicArray = topics.split(',').map(t => t.trim());
        filtered = filtered.filter(a =>
            a.topics.some(t => topicArray.includes(t))
        );
    }

    res.json({
        success: true,
        count: filtered.length,
        totalCount: articles.length,
        filters: { source, topics },
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
 * GET /api/content/articles/filter
 * Filter articles by labels
 * Query params: topic, organ, category
 */
router.get('/articles/filter', (req, res) => {
    try {
        const { topic, organ, category } = req.query;

        let filtered = articles.filter(a => a.topics && a.topics.length > 0);

        if (topic) {
            filtered = filtered.filter(a =>
                a.topics.includes(topic as string)
            );
        }

        if (organ) {
            filtered = filtered.filter(a =>
                a.organTypes.includes(organ as string)
            );
        }

        if (category) {
            filtered = filtered.filter(a =>
                a.categories.includes(category as string)
            );
        }

        res.json({
            success: true,
            count: filtered.length,
            articles: filtered.map(a => ({
                id: a.id,
                title: a.title,
                url: a.url,
                excerpt: a.excerpt,
                publishDate: a.publishDate,
                source: a.source,
                topics: a.topics,
                organTypes: a.organTypes,
                categories: a.categories
            }))
        });
    } catch (error) {
        console.error('Error filtering articles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter articles'
        });
    }
});

/**
 * GET /api/content/statistics
 * Get labeling statistics
 */
router.get('/statistics', (req, res) => {
    try {
        const stats = topicLabeler.getStatistics(articles);
        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
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

/**
 * DELETE /api/content/articles
 * Clear all stored articles (useful for testing)
 */
router.delete('/articles', (req: Request, res: Response) => {
    const count = articles.length;
    articles.length = 0;
    crawlerManager.clearArticles();

    res.json({
        success: true,
        message: `Cleared ${count} articles`,
    });
});

/**
 * POST /api/content/label
 * Label all unlabeled articles
 */
router.post('/label', async (req, res) => {
    try {
        const unlabeledArticles = articles.filter(a =>
            !a.topics || a.topics.length === 0
        );

        if (unlabeledArticles.length === 0) {
            return res.json({
                success: true,
                message: 'No unlabeled articles to process',
                labeled: 0,
                total: articles.length
            });
        }

        console.log(`Labeling ${unlabeledArticles.length} articles...`);
        const labeledArticles = await topicLabeler.labelArticles(unlabeledArticles);

        // Update the articles array with labeled versions
        labeledArticles.forEach(labeledArticle => {
            const index = articles.findIndex(a => a.id === labeledArticle.id);
            if (index == -1) {
                articles[index] = labeledArticle;
            }
        });

        res.json({
            success: true,
            message: `Successfully labeled ${labeledArticles.length} articles`,
            labeled: labeledArticles.length,
            total: articles.length
        });
    } catch (error) {
        console.error('Error in label endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to label articles'
        });
    }
});

/**
 * POST /api/content/label/:id
 * Label a specific article by ID
 */
router.post('/label/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const article = articles.find(a => a.id === articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found'
            });
        }

        const labeledArticle = await topicLabeler.labelArticle(article);

        res.json({
            success: true,
            article: {
                id: labeledArticle.id,
                title: labeledArticle.title,
                topics: labeledArticle.topics,
                organTypes: labeledArticle.organTypes,
                categories: labeledArticle.categories
            }
        });
    } catch (error) {
        console.error('Error labeling article:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to label article'
        });
    }
});

export default router;
