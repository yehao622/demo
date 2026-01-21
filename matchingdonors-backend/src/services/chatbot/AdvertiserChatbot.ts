import { GoogleGenAI } from "@google/genai";
import { advertiserFAQs, FAQ } from "../../data/advertiserFAQs";
import { AdvertiserLead } from "../../models/AdvertiserLead";

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    messages: ChatMessage[];
    lead?: Partial<AdvertiserLead>;
    createdAt: Date;
}

export class AdvertiserChatbot {
    private ai: GoogleGenAI;
    private sessions: Map<string, ChatSession> = new Map();

    private readonly SYSTEM_PROMPT = `You are a friendly and professional advertising sales assistant for MatchingDonors.com and its network of medical information websites (DailyDiabetesNews.com, DailyTransplantNews.com, IrishDailyTransplantNews.com).
                                    Your role is to:
                                    1. Answer questions about advertising opportunities, pricing, audience demographics, and ad formats
                                    2. Qualify potential advertisers by gathering key information
                                    3. Build rapport and enthusiasm about advertising with us
                                    4. Use the provided FAQ knowledge base to give accurate, specific answers
                                    5. When appropriate, collect advertiser contact information for follow - up

                                    Guidelines:
                                    - Be conversational, warm, and helpful
                                    - Use the FAQ data to provide specific pricing, stats, and details
                                    - Don't make up information - if you don't know something from the FAQs, say you'll have a sales rep follow up
                                    - Gradually collect information: company name, contact info, budget, goals
                                    - End conversations by offering to connect them with a sales representative
                                    - Use appropriate formatting(bullets, line breaks) for readability
                                    - Keep responses concise(3 - 5 sentences typically, longer for detailed questions)
                                Tone: Professional but friendly, enthusiastic about helping advertisers reach our highly engaged medical audience.`;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    // Create a new chat session
    createSession(): string {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const session: ChatSession = {
            id: sessionId,
            messages: [
                {
                    role: 'assistant',
                    content: `Hello! 👋 Welcome to MatchingDonors.com Advertising.\n\nI'm here to help you reach our highly engaged audience of patients, donors, and healthcare professionals across our network of medical websites.\n\nHow can I help you today? I can answer questions about:\n• Advertising rates and packages\n• Our audience demographics\n• Ad formats and placements\n• Getting started with a campaign\n\nOr feel free to ask me anything!`,
                    timestamp: new Date()
                }
            ],
            createdAt: new Date()
        };

        this.sessions.set(sessionId, session);
        return sessionId;
    }

    // Get chat session
    getSession(sessionId: string): ChatSession | undefined {
        return this.sessions.get(sessionId);
    }

    // Send a message and get AI response
    async sendMessage(sessionId: string, userMessage: string): Promise<string> {
        const session = this.sessions.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        // Add user message to history
        session.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });

        try {
            // Find relevant FAQs
            const relevantFAQs = this.findRelevantFAQs(userMessage);

            // Build context with FAQ information
            const faqContext = relevantFAQs.length > 0
                ? `\n\nRelevant FAQ Information:\n${relevantFAQs.map(faq =>
                    `Q: ${faq.question}\nA: ${faq.answer}`
                ).join('\n\n')}`
                : '';

            // Build conversation history
            const conversationHistory = session.messages
                .slice(-6) // Last 6 messages for context
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n\n');

            // Generate response with Gemini
            const prompt = `${this.SYSTEM_PROMPT}${faqContext}\n\nConversation History:\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:`;

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const assistantMessage = response.text?.trim() ||
                "I apologize, I'm having trouble responding right now. Could you please rephrase your question?";

            // Add assistant response to history
            session.messages.push({
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date()
            });

            // Try to extract lead information from conversation
            this.extractLeadInfo(session, userMessage);

            return assistantMessage;
        } catch (error) {
            console.error('Error generating chatbot response:', error);

            // Fallback response
            const fallbackMessage = "I apologize for the technical difficulty. Let me connect you with our advertising team directly. You can email advertising@matchingdonors.com or call 1-800-XXX-XXXX.";

            session.messages.push({
                role: 'assistant',
                content: fallbackMessage,
                timestamp: new Date()
            });

            return fallbackMessage;
        }
    }

    // Find relevant FAQs based on user query
    private findRelevantFAQs(query: string): FAQ[] {
        const queryLower = query.toLowerCase();
        const scoredFAQs: Array<{ faq: FAQ; score: number }> = [];

        for (const faq of advertiserFAQs) {
            let score = 0;

            // Check keywords
            for (const keyword of faq.keywords) {
                if (queryLower.includes(keyword.toLowerCase())) {
                    score += 2;
                }
            }

            // Check question similarity
            if (queryLower.includes(faq.question.toLowerCase().substring(0, 20))) {
                score += 3;
            }

            if (score > 0) {
                scoredFAQs.push({ faq, score });
            }
        }

        // Sort by score and return top 2-3 most relevant
        return scoredFAQs
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(item => item.faq);
    }

    // Extract lead information from conversation
    private extractLeadInfo(session: ChatSession, userMessage: string): void {
        if (!session.lead) {
            session.lead = {};
        }

        // Simple extraction patterns (can be enhanced with NLP)
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const phoneRegex = /(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/;

        const emailMatch = userMessage.match(emailRegex);
        if (emailMatch) {
            session.lead.email = emailMatch[0];
        }

        const phoneMatch = userMessage.match(phoneRegex);
        if (phoneMatch) {
            session.lead.phone = phoneMatch[0];
        }

        // Budget detection
        const budgetRegex = /\$\s*(\d{1,3}(,\d{3})*|\d+)/;
        const budgetMatch = userMessage.match(budgetRegex);
        if (budgetMatch) {
            session.lead.monthlyBudget = budgetMatch[0];
        }
    }

    // Save to storage
    saveLead(sessionId: string, leadData: Partial<AdvertiserLead>): AdvertiserLead {
        const session = this.sessions.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        // Merge with any extracted info from conversation
        const fullLead: AdvertiserLead = {
            id: `lead-${Date.now()}`,
            timestamp: new Date(),
            companyName: leadData.companyName || '',
            contactName: leadData.contactName || '',
            email: leadData.email || session.lead?.email || '',
            phone: leadData.phone || session.lead?.phone,
            website: leadData.website,
            monthlyBudget: leadData.monthlyBudget || session.lead?.monthlyBudget,
            campaignGoals: leadData.campaignGoals,
            targetAudience: leadData.targetAudience,
            preferredStartDate: leadData.preferredStartDate,
            industry: leadData.industry,
            previousAdvertising: leadData.previousAdvertising,
            questions: leadData.questions,
            conversationSummary: this.generateConversationSummary(session),
            status: 'new',
            source: 'chatbot'
        };

        session.lead = fullLead;

        return fullLead;
    }

    // Generate conversation summary
    private generateConversationSummary(session: ChatSession): string {
        const userMessages = session.messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content);

        return `Chat session with ${userMessages.length} user messages. Main topics discussed: ${userMessages.slice(0, 3).join(' | ')
            }`;
    }

    // Get all messages from a session
    getMessages(sessionId: string): ChatMessage[] {
        const session = this.sessions.get(sessionId);
        return session?.messages || [];
    }

    // Clean up old sessions (call periodically)
    cleanupOldSessions(maxAgeHours: number = 24): void {
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt.getTime() > maxAge) {
                this.sessions.delete(sessionId);
            }
        }
    }
}