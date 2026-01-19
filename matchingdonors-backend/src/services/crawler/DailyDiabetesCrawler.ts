import * as cheerio from 'cheerio';
import { BaseCrawler } from './BaseCrawler';
import { Article } from '../../models/Article';

export class DailyDiabetesCrawler extends BaseCrawler {
    constructor() {
        super('https://dailydiabetesnews.com', 'dailydiabetes');
    }

    // Extract article links from DailyDiabetesNews homepage (selectors may need adjustment basd on each specific site structure)
    extractArticleLinks(html: string): string[] {
        const $ = this.loadHtml(html);
        const links: string[] = [];

        // Common WordPress/news site selectors, adjust these selectors after inspecting the actual site
        const selectors = [
            'article a',           // WordPress standard
            '.entry-title a',                      // Common theme pattern
            '.post-title a',                       // Alternative pattern
            'h2 a',                                // Specific heading pattern
            'h3 a',
            '.article-title a',                    // Generic article pattern
            'article h2 a',                        // Article heading links
            '.post a.more-link',                   // "Read more" links
        ];

        // Site-specific selector - inspect site to find correct selector
        selectors.forEach(selector => {
            $(selector).each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    // handle relative vs absolute Urls
                    const fullUrl = this.normalizeUrl(href);

                    // Filter out non-article URLs (categories, tags, author pages, etc.)
                    if (this.isArticleUrl(fullUrl)) {
                        links.push(fullUrl);
                    }
                }
            });
        });

        return links;
    }

    extractArticleContent(html: string, url: string): Partial<Article> {
        const $ = this.loadHtml(html);

        // Extract titles with multiple selectors
        const title = this.extractTitle($);

        // Extract content with multiple selectors
        const content = this.extractContent($);

        // Generate publish date
        const publishDate = this.extractPublishDate($);

        // Generate excerpt
        const excerpt = this.generateExcerpt(content);

        const result: Partial<Article> = {
            title,
            content,
            excerpt,
            rawHtml: html,
        };

        if (publishDate !== undefined) {
            result.publishDate = publishDate;
        }

        return result;
    }

    private extractTitle($: cheerio.CheerioAPI): string {
        const selectors = [
            'h1.entry-title',
            'h1.post-title',
            'article h1',
            'h1.article-title',
            '.page-title h1',
            'h1',
        ];

        for (const selector of selectors) {
            const titleElem = $(selector).first();
            if (titleElem.length > 0) {
                const title = this.cleanText(titleElem.text());
                if (title.length > 0) {
                    return title;
                }
            }
        }

        throw new Error('Could not extract article title');
    }

    // Extract article content with multiple fallback selectors
    private extractContent($: cheerio.CheerioAPI): string {
        const selectors = [
            '.entry-content',
            '.post-content',
            'article .content',
            '.article-content',
            'article',
            'main',
        ];

        for (const selector of selectors) {
            const contentElem = $(selector).first().clone();
            if (contentElem.length > 0) {
                // Remove unwanted elements
                contentElem.find('script, style, .social-share, .advertisement, .ads, .share-buttons, .related-posts, .author-bio').remove();

                const content = this.cleanText(contentElem.text());
                if (content.length > 100) {
                    return content; // Ensure meaninful content return
                }
            }
        }

        throw new Error('Could not extract artile content');
    }

    // Extract publish date with multi-fallback selectors
    private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
        // try <time> tag with datetime attribute 
        const timeElem = $('time').first();
        if (timeElem.length > 0) {
            const datetime = timeElem.attr('datetime');
            if (datetime) {
                const date = new Date(datetime);
                if (!isNaN(date.getDate())) {
                    return date;
                }
            }
        }

        // Try meta tags
        const metaSelectors = [
            'meta[property="article:published_time"]',
            'meta[name="publication_date"]]',
            'meta[name="date"]',
        ];

        for (const selector of metaSelectors) {
            const content = $(selector).attr('content');
            if (content) {
                const date = new Date(content);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Try date-specific class
        const dateSelectors = [
            '.entry-date',
            '.post-date',
            '.publish-date',
            '.published',
        ];

        for (const selector of dateSelectors) {
            const dateText = $(selector).first().text().trim();
            if (dateText) {
                const date = new Date(dateText);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        console.warn(`[${this.source}] Could not extract publish date`);
        return undefined;
    }

    // Check if URL is likely an article (not category, tag, author page, etc)
    private isArticleUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname.toLowerCase();

            // Exclude common no-article paths
            const excludePatterns = [
                '/category/',
                '/tag/',
                '/author/',
                '/page/',
                '/search/',
                '/wp-admin/',
                '/wp-content/',
                '/feed/',
                '/rss/',
                '/about',
                '/contact',
                '/privacy',
                '/terms',
                '/register',
                '/reviews-guidelines',
                '/amp/',
                '.jpg',
                '.png',
                '.pdf',
                '.css',
                '.js',
            ];

            for (const pattern of excludePatterns) {
                if (path.includes(pattern)) {
                    return false;
                }
            }

            // Must be from the same domain
            if (urlObj.hostname !== new URL(this.baseUrl).hostname) {
                return false;
            }

            // Must have some path (not just homepage)
            if (path === '/' || path === '') {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }
}