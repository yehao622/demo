export type ArticleSource = 'matchingdonors' | 'dailydiabetes' | 'dailytransplant' | 'irishtransplant';

export interface Article {
    id: string;
    source: ArticleSource;
    title: string;
    url: string;
    content: string;
    excerpt: string;
    publishDate?: Date | undefined;
    crawledAt: Date;
    topics: string[];
    organTypes: string[];
    categories: string[];
    rawHtml?: string | undefined;
}

export interface CrawlResult {
    success: boolean;
    articlesCount: number;
    articles: Article[];
    errors?: string[];
}