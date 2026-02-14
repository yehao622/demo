import express, { Request, Response } from 'express';
import { Article } from '../models/Article';
import { CrawlerManager } from '../services/crawler/CrawlerManager';
import { TopicLabeler } from '../services/labeler/topicLabeler';
import { ArticleMatcherService } from '../services/articleMatcher.service';
import db from '../database/init'; // Using your existing DB connection

const router = express.Router();

// --- Service Initialization ---
const crawlerManager = new CrawlerManager();
const topicLabeler = new TopicLabeler(process.env.GEMINI_API_KEY || '');
const articleMatcher = new ArticleMatcherService();

// --- Helper Functions: Data Mapping ---

// 1. Database Row (snake_case) -> Application Object (camelCase)
const rowToArticle = (row: any): Article => ({
    id: row.id,
    title: row.title,
    url: row.url,
    // Map DB 'summary' to Article 'excerpt'
    excerpt: row.summary,
    // Map DB 'publish_date' to Article 'publishDate'
    publishDate: row.publish_date,
    source: row.source,
    // Note: 'content' column does not exist in your init.ts, so we use summary/excerpt
    content: row.summary,
    crawledAt: row.created_at, // Map DB 'created_at' to 'crawledAt'

    // Parse JSON strings back to arrays
    topics: typeof row.topics === 'string' ? JSON.parse(row.topics || '[]') : row.topics,
    // Map DB 'organs' to Article 'organTypes'
    organTypes: typeof row.organs === 'string' ? JSON.parse(row.organs || '[]') : row.organs,
    categories: typeof row.categories === 'string' ? JSON.parse(row.categories || '[]') : row.categories,
});

// 2. Application Object (camelCase) -> Save to Database (snake_case)
const saveArticleToDb = (article: Article): boolean => {
    try {
        // Check for duplicates
        const checkStmt = db.prepare('SELECT id FROM articles WHERE url = ?');
        const existing = checkStmt.get(article.url);

        if (existing) return false;

        const insertStmt = db.prepare(`
            INSERT INTO articles (
                id, title, url, summary, source, publish_date, 
                topics, organs, categories, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Helper to ensure 'undefined' becomes 'null' for SQLite
        const safe = (val: any) => (val === undefined ? null : val);

        // 2. Ensure Date objects become Strings (SQLite requirement)
        const toDateString = (val: any) => {
            if (!val) return null;
            if (val instanceof Date) return val.toISOString();
            return val; // Assume it's already a string
        };

        // Use 'excerpt' as 'summary'. If content is available but excerpt is empty, use content snippet.
        const summaryText = article.excerpt || (article.content ? article.content.substring(0, 200) + '...' : null);

        insertStmt.run(
            safe(article.id),
            safe(article.title),
            safe(article.url),
            safe(summaryText),
            safe(article.source),
            toDateString(article.publishDate), // Matches 'publish_date'
            JSON.stringify(article.topics || []),
            JSON.stringify(article.organTypes || []), // Matches 'organs'
            JSON.stringify(article.categories || []),
            toDateString(article.crawledAt) || new Date().toISOString() // Matches 'created_at'
        );
        return true;
    } catch (error) {
        console.error('[Database] Save failed:', error);
        return false;
    }
};

// 3. Update labels in Database
const updateArticleLabelsInDb = (article: Article) => {
    try {
        const updateStmt = db.prepare(`
            UPDATE articles 
            SET topics = ?, organs = ?, categories = ? 
            WHERE id = ?
        `);

        updateStmt.run(
            JSON.stringify(article.topics || []),
            JSON.stringify(article.organTypes || []), // Matches 'organs'
            JSON.stringify(article.categories || []),
            article.id
        );
    } catch (error) {
        console.error('[Database] Update labels failed:', error);
    }
};

// --- Background Automation ---

/**
 * 1. Startup Sync: Load existing articles from DB into AI Search Index
 */
const initializeSearchIndex = async () => {
    console.log('[Search] Initializing index from database...');
    try {
        // Check if table has data
        const countRes = db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };

        if (!countRes || countRes.count === 0) {
            console.log('[Search] Database is empty. Waiting for crawler.');
            runAutomatedCrawl();
            return;
        }

        const rows = db.prepare('SELECT * FROM articles').all();
        const articles = rows.map(rowToArticle);

        const validArticles = articles.filter(a => a.topics && a.topics.length > 0);

        if (validArticles.length > 0) {
            await articleMatcher.storeArticlesBatch(validArticles);
            console.log(`[Search] ✓ Successfully indexed ${validArticles.length} articles from DB.`);
        } else {
            console.log('[Search] Found articles in DB, but none are labeled yet.');
        }
    } catch (error) {
        console.error('[Search] Failed to initialize index:', error);
    }
};

// Run initialization (delayed slightly to ensure DB connection is ready)
setTimeout(initializeSearchIndex, 1000);

/**
 * 2. Scheduled Task: Automated Crawling & Labeling
 */
const runAutomatedCrawl = async () => {
    console.log('[Auto-Crawler] Starting scheduled crawl cycle...');
    try {
        // Step A: Crawl
        const crawledArticles = await crawlerManager.crawlAllSites(5);

        // Step B: Save
        let newArticles: Article[] = [];
        for (const article of crawledArticles) {
            const isNew = saveArticleToDb(article);
            if (isNew) newArticles.push(article);
        }
        console.log(`[Auto-Crawler] Saved ${newArticles.length} new articles.`);

        // Step C: Label & Index
        if (newArticles.length > 0) {
            console.log(`[Auto-Crawler] Auto-labeling ${newArticles.length} new articles...`);
            const labeled = await topicLabeler.labelArticles(newArticles);

            for (const art of labeled) {
                updateArticleLabelsInDb(art);
                await articleMatcher.storeArticle(art);
            }
            console.log('[Auto-Crawler] Cycle complete. New articles are live.');
        } else {
            console.log('[Auto-Crawler] Cycle complete. No new content found.');
        }

    } catch (error) {
        console.error('[Auto-Crawler] Error:', error);
    }
};

// Schedule: Run every 2 hours
const CRAWL_INTERVAL = 12 * 60 * 60 * 1000;
setInterval(runAutomatedCrawl, CRAWL_INTERVAL);
console.log(`[System] Auto-crawler scheduled (Interval: 2 hours)`);


// --- REST API Routes ---

/**
 * POST /api/content/crawl
 */
router.post('/crawl', async (req: Request, res: Response) => {
    try {
        const { site, maxArticles = 5, crawlAll = false } = req.body;
        console.log(`[API] Manual crawl request received.`);

        let crawledArticles: Article[] = [];

        if (crawlAll) {
            crawledArticles = await crawlerManager.crawlAllSites(maxArticles);
        } else if (site) {
            const availableSites = crawlerManager.getAvailableSites();
            if (!availableSites.includes(site)) {
                return res.status(400).json({ success: false, error: `Invalid site. Available: ${availableSites.join(', ')}` });
            }
            crawledArticles = await crawlerManager.crawlSite(site, maxArticles);
        } else {
            return res.status(400).json({ success: false, error: 'Specify "site" or set "crawlAll": true' });
        }

        let newCount = 0;
        for (const article of crawledArticles) {
            const isNew = saveArticleToDb(article);
            if (isNew) newCount++;
        }

        res.json({
            success: true,
            message: `Crawl complete. Found ${crawledArticles.length} items.`,
            newArticlesSaved: newCount,
            articles: crawledArticles.map(a => ({
                id: a.id,
                title: a.title,
                url: a.url,
                source: a.source
            }))
        });
    } catch (error) {
        console.error('[API] Crawl failed:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Crawl failed' });
    }
});

/**
 * GET /api/content/articles
 */
router.get('/articles', async (req: Request, res: Response) => {
    try {
        // Use 'publish_date' (snake_case) for sorting
        const rows = db.prepare('SELECT * FROM articles ORDER BY publish_date DESC').all();
        const formattedArticles = rows.map(rowToArticle);

        res.json({
            success: true,
            count: formattedArticles.length,
            articles: formattedArticles
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles from database' });
    }
});

/**
 * GET /api/content/articles/filter
 */
router.get('/articles/filter', async (req, res) => {
    try {
        const { topic, organ, category } = req.query;

        let query = 'SELECT * FROM articles WHERE 1=1';
        const params: string[] = [];

        // Note: DB columns are 'topics', 'organs', 'categories'
        if (topic) {
            query += ' AND topics LIKE ?';
            params.push(`%"${topic}"%`);
        }
        if (organ) {
            query += ' AND organs LIKE ?'; // 'organs' in DB
            params.push(`%"${organ}"%`);
        }
        if (category) {
            query += ' AND categories LIKE ?';
            params.push(`%"${category}"%`);
        }

        query += ' ORDER BY publish_date DESC';

        const filtered = db.prepare(query).all(params);

        res.json({
            success: true,
            articles: filtered.map(rowToArticle)
        });
    } catch (error) {
        console.error('Error filtering articles:', error);
        res.status(500).json({ success: false, error: 'Failed to filter articles' });
    }
});

/**
 * POST /api/content/label
 */
router.post('/label', async (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM articles WHERE topics IS NULL OR topics = '[]'").all();
        const unlabeledArticles = rows.map(rowToArticle);

        if (unlabeledArticles.length === 0) {
            return res.json({ success: true, message: 'No unlabeled articles found', labeled: 0 });
        }

        console.log(`[API] Labeling ${unlabeledArticles.length} articles...`);
        const labeledArticles = await topicLabeler.labelArticles(unlabeledArticles);

        for (const art of labeledArticles) {
            updateArticleLabelsInDb(art);
            await articleMatcher.storeArticle(art);
        }

        res.json({
            success: true,
            message: `Successfully labeled ${labeledArticles.length} articles`,
            labeled: labeledArticles.length
        });
    } catch (error) {
        console.error('Error in label endpoint:', error);
        res.status(500).json({ success: false, error: 'Failed to label articles' });
    }
});

/**
 * GET /api/content/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM articles').all();
        const allArticles = rows.map(rowToArticle);

        const stats = topicLabeler.getStatistics(allArticles);

        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ success: false, error: 'Failed to get statistics' });
    }
});

/**
 * POST /api/content/search
 */
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query, topN = 10, minSimilarity = 0.3 } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ success: false, error: 'Query required' });
        }

        const searchResult = await articleMatcher.searchArticles({
            query,
            topN,
            minSimilarity
        });

        res.json({
            success: true,
            data: {
                query: searchResult.query,
                summary: searchResult.summary,
                matches: searchResult.matches.map(match => ({
                    article: match.article,
                    similarity: match.similarity,
                    rank: match.rank
                })),
                queryAnalysis: searchResult.queryAnalysis
            }
        });
    } catch (error) {
        console.error('[Search] Error:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Search failed' });
    }
});

/**
 * GET /api/content/sites
 */
router.get('/sites', (req: Request, res: Response) => {
    res.json({ success: true, sites: crawlerManager.getAvailableSites() });
});

/**
 * GET /api/content/articles/:id
 */
router.get('/articles/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

        if (!row) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }

        res.json({ success: true, article: rowToArticle(row) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
});

/**
 * DELETE /api/content/articles
 */
router.delete('/articles', async (req: Request, res: Response) => {
    try {
        db.prepare('DELETE FROM articles').run();
        crawlerManager.clearArticles();
        articleMatcher.clearAll();

        res.json({ success: true, message: 'All articles deleted from database and index.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Delete failed' });
    }
});

export default router;