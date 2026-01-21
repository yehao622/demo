export interface AdvertiserLead {
    id: string;
    timestamp: Date;

    // Contact Information
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    website?: string;

    // Campaign Details
    monthlyBudget?: string;
    campaignGoals?: string;
    targetAudience?: string;
    preferredStartDate?: string;

    // Additional Info
    industry?: string;
    previousAdvertising?: string;
    questions?: string;

    // Metadata
    conversationSummary: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    source: 'chatbot';
}