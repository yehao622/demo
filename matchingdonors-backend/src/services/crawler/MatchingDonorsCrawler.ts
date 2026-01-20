import * as cheerio from 'cheerio';
import { BaseCrawler } from './BaseCrawler';
import { Article } from '../../models/Article';

/**
 * Crawler for MatchingDonors.com/life
 * Note: This is NOT a traditional blog - it's a donor matching platform
 * with informational pages and patient stories
 */
export class MatchingDonorsCrawler extends BaseCrawler {
    constructor() {
        super('https://matchingdonors.com/life', 'matchingdonors');
    }

    /**
     * Override normalizeUrl to handle MatchingDonors' structure correctly
     * Most links start with /life/, so we need to handle them properly
     */
    protected normalizeUrl(href: string): string {
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return href;
        }

        if (href.startsWith('//')) {
            return 'https:' + href;
        }

        // For MatchingDonors, handle absolute paths carefully
        if (href.startsWith('/')) {
            // If the path already includes /life/, use root domain
            if (href.startsWith('/life/')) {
                return 'https://matchingdonors.com' + href;
            }
            // Otherwise, assume it needs /life prefix
            return 'https://matchingdonors.com/life' + href;
        }

        // For relative paths (no leading /), append to baseUrl
        return this.baseUrl + '/' + href;
    }

    /**
     * Extract article links from MatchingDonors
     */
    extractArticleLinks(html: string): string[] {
        const $ = this.loadHtml(html);
        const links: string[] = [];

        // Strategy 1: Find all links on the page
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = this.normalizeUrl(href);
                if (this.isArticleUrl(fullUrl)) {
                    links.push(fullUrl);
                }
            }
        });

        // Strategy 2: Add known content pages if we have few links
        if (links.length < 5) {
            console.log(`[${this.source}] Found ${links.length} links, adding known content pages...`);

            const knownPages = [
                'https://matchingdonors.com/life/index.cfm?page=p010',
                'https://matchingdonors.com/life/index.cfm?page=p027',
                'https://matchingdonors.com/life/index.cfm?page=p030',
                'https://matchingdonors.com/life/index.cfm?page=p007',
                'https://matchingdonors.com/life/index.cfm?page=livingdonation',
                'https://matchingdonors.com/life/newsletter/',  // FIX: Use /life/newsletter/
            ];

            // Add known pages if not already in the list
            for (const page of knownPages) {
                if (!links.includes(page)) {
                    links.push(page);
                }
            }
        }

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
            'h1',
            'h2',
            'title',
        ];

        for (const selector of selectors) {
            const titleElem = $(selector).first();
            if (titleElem.length > 0) {
                let title = this.cleanText(titleElem.text());

                // Clean up page title
                if (selector === 'title') {
                    title = title.replace(/\s*[-|,]\s*(Organ Donor|Matching Donors|MatchingDonors).*$/i, '').trim();
                    title = title.replace(/\s*::\s*.*$/i, '').trim();  // Remove :: suffixes
                }

                if (title.length > 10) {
                    return title;
                }
            }
        }

        // Fallback: use URL parameter as title
        return 'MatchingDonors Information Page';
    }

    private extractContent($: cheerio.CheerioAPI): string {
        // Remove unwanted elements first
        $('script, style, noscript, iframe').remove();

        // Strategy 1: Extract all meaningful paragraphs from the entire page
        let allParagraphs = '';
        $('p').each((_, p) => {
            const pText = $(p).text().trim();
            // Filter out navigation/menu text and keep actual content
            if (pText.length > 30 &&
                !pText.includes(':::: Welcome') &&
                !pText.includes('Select County') &&
                !pText.includes('Your Name') &&
                !pText.includes('Email Address') &&
                !pText.includes('Telephone Number') &&
                !pText.includes('Promo Code') &&
                !pText.includes('I\'m not a robot')) {
                allParagraphs += pText + '\n\n';
            }
        });

        if (allParagraphs.length > 100) {
            return this.cleanText(allParagraphs);
        }

        // Strategy 2: Try content containers
        const contentSelectors = [
            'article',
            'main',
            '.content',
            '.main-content',
            'body',
        ];

        for (const selector of contentSelectors) {
            const contentElem = $(selector).first().clone();
            if (contentElem.length > 0) {
                // Remove unwanted elements
                contentElem.find('script, style, noscript, iframe, header, nav, footer, form, input, button, .menu, .navigation').remove();

                const content = this.cleanText(contentElem.text());

                if (content.length > 100) {
                    return content;
                }
            }
        }

        // Strategy 3: Get all body text as last resort
        $('header, nav, footer, form, .menu, .navigation').remove();
        const bodyText = this.cleanText($('body').text());

        if (bodyText.length > 100) {
            return bodyText;
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

        console.warn(`[${this.source}] Could not extract publish date (this is normal for MatchingDonors info pages)`);
        return undefined;
    }

    /**
     * Validate if URL is an article
     */
    private isArticleUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);

            // Must be from MatchingDonors domain
            if (!urlObj.hostname.includes('matchingdonors.com')) {
                return false;
            }

            const fullUrl = url.toLowerCase();

            // ACCEPT: ColdFusion content pages with p### format
            if (fullUrl.includes('index.cfm?page=p') ||
                fullUrl.includes('index.cfm?page=livingdonation')) {
                return true;
            }

            // ACCEPT: Newsletter pages (must be /life/newsletter/)
            if (fullUrl.includes('/life/newsletter')) {
                return true;
            }

            // EXCLUDE: Donor/Patient login and search pages
            const excludePatterns = [
                '?page=services',
                '?page=step',
                '?page=position-search',  // FIX: Exclude donor search pages
                'frm=about',
                'page=main',
                'page=login',
                'page=zoom-browser',
                '/donations/',
                '/advertise',
                '/patient/',
                '/donor/',
                '/life/donor/',           // FIX: Exclude donor portal
                '/life/patient/',          // FIX: Exclude patient portal
                '.jpg',
                '.png',
                '.gif',
                '.css',
                '.js',
                '.pdf',
            ];

            for (const pattern of excludePatterns) {
                if (fullUrl.includes(pattern)) {
                    return false;
                }
            }

            return false;  // Default: reject unless explicitly matched
        } catch {
            return false;
        }
    }
}
