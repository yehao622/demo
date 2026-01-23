export type ArticleSource = 'matchingdonors' | 'dailydiabetes' | 'dailytransplant' | 'irishtransplant';

export interface Article {
    id: string;
    source: ArticleSource;
    title: string;
    url: string;
    content: string;
    excerpt: string;
    publishDate?: Date;
    crawledAt: Date;
    topics: string[];
    organTypes: string[];
    categories: string[];
}

export interface LabelStatistics {
    totalArticles: number;
    labeledArticles: number;
    unlabeledArticles: number;
    topicDistribution: Record<string, number>;
    organDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    allTopics: string[];
    allOrgans: string[];
    allCategories: string[];
}

export interface ContentApiResponse {
    success: boolean;
    count?: number;
    articles?: Article[];
    statistics?: LabelStatistics;
    error?: string;
}
