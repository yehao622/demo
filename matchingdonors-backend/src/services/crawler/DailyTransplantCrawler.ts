import * as cheerio from 'cheerio';
import { BaseCrawler } from './BaseCrawler';
import { Article } from '../../models/Article';
import { link } from 'node:fs';

// Inherit from BaseCrawler and implements site-specific html parsing logic
export class DailyTransplantCrawler extends BaseCrawler {
    constructor() {
        super('https://dailytransplantnews.com', 'dailytransplant');
    }

    /* Extract article links from the homepage/listing page: @param html-HTML content; @return--Array of article URLs
    1. Load HTML into Cheerio for jQuery-like DOM manipulation
    2. Try multiple CSS selectors
    3. Normalize relative URLs to absolute URLs
    4. Filter out non-article pages (categories, tags, etc.)
    */
    extractArticleLinks(html: string): string[] {
        const $ = this.loadHtml(html);
        const links: string[] = [];

        // Multiple selectors to handle different WordPress themes/layouts
        const selectors = [
            'article a',            // Standard WordPress article links
            '.entry-title a',       // Common WordPress theme selector
            '.post-title a',        // Alternative theme pattern
            'h2 a',                 // Headline links
            'h3 a',                 // Subheadline links
            '.article-title a',     // Generic article pattern
            'article h2 a',         // Article heading combination
            '.post a.more-link',    // "Read more" buttons
        ];

        selectors.forEach(selector => {
            $(selector).each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    const fullUrl = this.normalizeUrl(href);
                    // Add valid article URLs
                    if (this.isArticleUrl(fullUrl)) {
                        links.push(fullUrl);
                    }
                }
            });
        });

        return links;
    }

    /*
    Extract full article content from individual article page
    @param html - Raw html of the article page
    @param url - URL of the article 
    @return partial article object with extracted data
    1. Extract title using multiple fallback selectors
    2. Extract main content and clean unwanted elements
    3. Extract publish date from multiple sources
    4. Extract excerpt from content
    */
    extractArticleContent(html: string, url: string): Partial<Article> {
        const $ = this.loadHtml(html);

        //Extract components with fallback selectors
        const title = this.extractTitle($);
        const content = this.extractContent($);
        const publishDate = this.extractPublishDate($);
        const excerpt = this.generateExcerpt(content);

        const result: Partial<Article> = {
            title,
            content,
            excerpt,
            rawHtml: html,
        };

        // Add publishDate if extract successfully
        if (publishDate !== undefined) {
            result.publishDate = publishDate;
        }

        return result;
    }

    /**
     * Extract article title with multiple fallback selectors
     * @param $ - Cheerio instance with loaded HTML
     * @return cleaned article title
     * @throws error if no foun
     */
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

    /**
     * Extract main article content
     * @param $ - Cheerio instance
     * @return cleaned article text content
     * 1. Try multiple common content container selectors
     * 2. Clone element to avoid modifyting original DOM
     * 3. Remove scripts, ads, social buttons, etc.
     * 4. Extract and clean text
     * 5. Ensure minimum content length
     */
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
                // Remove unwanted elements that aren't part of article
                contentElem.find('script, style, .social-share, .advertisement, .ads, .share-buttons, .related-posts, .author-bio').remove();

                const content = this.cleanText(contentElem.text());
                if (content.length > 100) {
                    return content;
                }
            }
        }

        throw new Error('Could not extract article content');
    }

    /**
     * Extract publish date from various html sources
     * @param $ - Cheerios instance
     * @return -Date object or underfined
     * 1. <time> tag with datetime attribute
     * 2. Meta tags 
     * 3. Date-specific CSS classes
     */
    private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
        const timeElem = $('time').first();
        if (timeElem.length > 0) {
            const datetime = timeElem.attr('datetime');
            if (datetime) {
                const date = new Date(datetime);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Meta tags
        const metaSelectors = [
            'meta[property="article:published_time"]',
            'meta[name="publication_date"]',
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

        // date-specific classes
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

    /**
     * Validate if URL is an article
     * @param url - Full URL to validate
     * @return true if likely an article
     * 1. Exclude common non-article paths
     * 2. Exclude static assets
     * 3. Must be from same domain
     * 4. Must have meaningful path
    */
    private isArticleUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname.toLowerCase();

            // Non-article url patterns
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

            // Same domain
            if (urlObj.hostname !== new URL(this.baseUrl).hostname) {
                return false;
            }

            // Not homepage
            if (path === '/' || path === '') {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }
}