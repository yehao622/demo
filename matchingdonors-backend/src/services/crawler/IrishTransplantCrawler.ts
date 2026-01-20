import * as cheerio from 'cheerio';
import { BaseCrawler } from './BaseCrawler';
import { Article } from '../../models/Article';

// Crawler for IrishDailyTransplantNews.com
export class IrishTransplantCrawler extends BaseCrawler {
    constructor() {
        super('https://irishdailytransplantnews.com', 'irishtransplant');
    }

    extractArticleLinks(html: string): string[] {
        const $ = this.loadHtml(html);
        const links: string[] = [];

        const selectors = [
            'article a',
            '.entry-title a',
            '.post-title a',
            'h2 a',
            'h3 a',
            '.article-title a',
            'article h2 a',
            '.post a.more-link',
        ];

        selectors.forEach(selector => {
            $(selector).each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    const fullUrl = this.normalizeUrl(href);
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
                contentElem.find('script, style, .social-share, .advertisement, .ads, .share-buttons, .related-posts, .author-bio').remove();

                const content = this.cleanText(contentElem.text());
                if (content.length > 100) {
                    return content;
                }
            }
        }

        throw new Error('Could not extract article content');
    }

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

    private isArticleUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname.toLowerCase();

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

            if (urlObj.hostname !== new URL(this.baseUrl).hostname) {
                return false;
            }

            if (path === '/' || path === '') {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }
}