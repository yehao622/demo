import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { Article, ArticleSource } from '../../models/Article';
import { link } from 'node:fs';

export abstract class BaseCrawler {
    protected baseUrl: string;
    protected source: ArticleSource;
    protected timeout: number = 10000;
    protected userAgent: string = 'MatchingDonors-ContentAgent/1.0 (Educational Demo)';

    constructor(baseUrl: string, source: ArticleSource) {
        this.baseUrl = baseUrl;
        this.source = source;
    }

    // Abstract methods each site must implement: Each site has different HTML/article structure
    abstract extractArticleLinks(html: string): string[];
    abstract extractArticleContent(html: string, url: string): Partial<Article>;

    // Common crawl logic: @param url - the URL to fetch; @returns HTML content as string
    protected async fetchHtml(url: string): Promise<string> {
        try {
            console.log(`[${this.source}] Fetching: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                },
                timeout: this.timeout,
                maxRedirects: 5,
            });

            console.log(`[${this.source}] ✓ Successfully fetched (${response.data.length} bytes)`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axioError = error as AxiosError;
                if (axioError.response) {
                    console.error(`${this.source} ✗ HTTP ${axioError.response.status}: ${url}`);
                    throw new Error(`HTTP ${axioError.response.status} error fetching ${url}`);
                } else if (axioError.request) {
                    console.error(`[${this.source}] ✗ No response received: ${url}`);
                    throw new Error(`No response from ${url} (timeout or network issue)`);
                }
            }
            console.error(`[${this.source}] ✗ Unexpected error:`, error);
            throw error;
        }
    }

    // Normalize URLs to handle both relative and absolute paths: @param href--href attribute from anchor tag; @return-- qualified URL
    protected normalizeUrl(href: string): string {
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return href;
        }

        // Handle protocol-relative URLs (//example.com/path)
        if (href.startsWith('//')) {
            return 'https:' + href;
        }

        // Handle absolute paths (/path/to/article)
        if (href.startsWith('/')) {
            return this.baseUrl + href;
        }

        // Handle relative paths
        return this.baseUrl + '/' + href;
    }

    // Crawl main page to get article links; @return -- array of article links
    async crawlIndex(): Promise<string[]> {
        try {
            const html = await this.fetchHtml(this.baseUrl);
            const links = this.extractArticleLinks(html);

            // Remove duplicate and filter out invalid URLs
            const uniqueLinks = [...new Set(links)].filter(link => {
                try {
                    new URL(link);
                    return true;
                } catch {
                    console.warn(`[${this.source}] Invalid URL skipped: ${link}`);
                    return false;
                }
            });

            console.log(`[${this.source}] Found ${uniqueLinks.length} unique article links`);
            return uniqueLinks;
        } catch (error) {
            console.error(`[${this.source}] Failed to crawl index:`, error);
            throw error;
        }
    }

    // Crawl individual article; @param url -- the article URL: @returns complete article object
    async crawlArticle(url: string): Promise<Article> {
        try {
            const html = await this.fetchHtml(url);
            const articleData = this.extractArticleContent(html, url);

            if (!articleData.title || articleData.title.trim().length === 0) {
                throw new Error('Article title is missing or empty');
            }

            if (!articleData.content || articleData.content.trim().length === 0) {
                throw new Error('Article content is missing or empty');
            }

            // Generate excerpt if not provided
            const excerpt = articleData.excerpt || this.generateExcerpt(articleData.content);

            const article: Article = {
                id: this.generateId(),
                source: this.source,
                url,
                crawledAt: new Date(),
                topics: [],
                organTypes: [],
                categories: [],
                title: articleData.title!,
                content: articleData.content!,
                excerpt,
                publishDate: articleData.publishDate,
                rawHtml: articleData.rawHtml,
            };

            console.log(`[${this.source}] ✓ Successfully crawled: "${article.title.substring(0, 60)}..."`);
            return article;
        } catch (error) {
            console.error(`[${this.source}] Failed to crawl article ${url}:`, error);
            throw error;
        }
    }

    // Generate a unique ID for an article: '{source}-{timestamp}-{random}'
    protected generateId(): string {
        return `${this.source}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    // Generate excerpt from content first 200 characters
    protected generateExcerpt(content: string, maxLength: number = 200): string {
        const cleaned = content.trim().replace(/\s+/g, ' ');
        if (cleaned.length <= maxLength) {
            return cleaned;
        }
        return cleaned.substring(0, maxLength).trim() + '...';
    }

    // Clean text content by remove extra whitespace
    protected cleanText(text: string): string {
        return text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
    }

    // Load html into Cheerio for parsing
    protected loadHtml(html: string): cheerio.CheerioAPI {
        return cheerio.load(html);
    }
}