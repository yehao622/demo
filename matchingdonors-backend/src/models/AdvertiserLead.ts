export interface AdvertiserLead {
    id: string;
    timestamp: Date;

    // Contact Information
    companyName: string;
    contactName: string;
    email: string;
    phone: string | undefined;
    website: string | undefined;

    // Campaign Details
    monthlyBudget: string | undefined;
    campaignGoals: string | undefined;
    targetAudience: string | undefined;
    preferredStartDate: string | undefined;

    // Additional Info
    industry: string | undefined;
    previousAdvertising: string | undefined;
    questions: string | undefined;

    // Metadata
    conversationSummary: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    source: 'chatbot';
}