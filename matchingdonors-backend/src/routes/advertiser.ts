import { Router } from "express";
import { AdvertiserChatbot } from "../services/chatbot/AdvertiserChatbot";
import { AdvertiserLead } from "../models/AdvertiserLead";
import { advertiserFAQs, faqCategories } from "../data/advertiserFAQs";

const router = Router();

// Initialize chatbot with Gemini API key
const chatbot = new AdvertiserChatbot(process.env.GEMINI_API_KEY || '');

// In-memory storage for leads (replace with database later)
const leads: AdvertiserLead[] = [];

/**
 * POST /api/advertiser/chat/start
 * Start a new chat session
 */
router.post('/chat/start', (req, res) => {
    try {
        const sessionId = chatbot.createSession();
        const messages = chatbot.getMessages(sessionId);

        res.json({
            success: true,
            sessionId,
            messages
        });
    } catch (error) {
        console.error('Error starting chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start chat session'
        });
    }
});

/**
 * POST /api/advertiser/chat/message
 * Send a message and get response
 */
router.post('/chat/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'sessionId and message are required'
            });
        }

        const response = await chatbot.sendMessage(sessionId, message);

        res.json({
            success: true,
            response,
            timestamp: new Date()
        });
    } catch (error: any) {
        console.error('Error processing chat message:', error);

        // Handle rate limiting gracefully
        if (error.status === 429) {
            return res.status(200).json({
                success: true,
                response: "I'm currently experiencing high volume. Please email us directly at advertising@matchingdonors.com or call 1-800-XXX-XXXX to speak with our team immediately.",
                timestamp: new Date()
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process message'
        });
    }
});

/**
 * GET /api/advertiser/chat/history/:sessionId
 * Get chat history for a session
 */
router.get('/chat/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = chatbot.getMessages(sessionId);

        if (!messages || messages.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history'
        });
    }
});

/**
 * POST /api/advertiser/lead
 * Submit a lead from the chatbot
 */
router.post('/lead', (req, res) => {
    try {
        const { sessionId, leadData } = req.body;

        if (!sessionId || !leadData) {
            return res.status(400).json({
                success: false,
                error: 'sessionId and leadData are required'
            });
        }

        // Validate required fields
        if (!leadData.companyName || !leadData.contactName || !leadData.email) {
            return res.status(400).json({
                success: false,
                error: 'Company name, contact name, and email are required'
            });
        }

        const lead = chatbot.saveLead(sessionId, leadData);
        leads.push(lead);

        console.log(`✅ New advertiser lead captured: ${lead.companyName} (${lead.email})`);

        res.json({
            success: true,
            message: 'Lead submitted successfully',
            leadId: lead.id
        });
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save lead'
        });
    }
});

/**
 * GET /api/advertiser/leads
 * Get all leads (admin endpoint)
 */
router.get('/leads', (req, res) => {
    try {
        const { status } = req.query;

        let filteredLeads = leads;

        if (status) {
            filteredLeads = leads.filter(lead => lead.status === status);
        }

        // Sort by timestamp descending (newest first)
        const sortedLeads = filteredLeads.sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        );

        res.json({
            success: true,
            count: sortedLeads.length,
            leads: sortedLeads
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leads'
        });
    }
});

/**
 * GET /api/advertiser/leads/:id
 * Get a specific lead by ID
 */
router.get('/leads/:id', (req, res) => {
    try {
        const { id } = req.params;
        const lead = leads.find(l => l.id === id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lead'
        });
    }
});

/**
 * PATCH /api/advertiser/leads/:id/status
 * Update lead status
 */
router.patch('/leads/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const lead = leads.find(l => l.id === id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        lead.status = status;

        res.json({
            success: true,
            message: 'Lead status updated',
            lead
        });
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update lead status'
        });
    }
});

/**
 * GET /api/advertiser/faqs
 * Get all FAQs (optional, for displaying FAQ list)
 */
router.get('/faqs', (req, res) => {
    try {
        const { category } = req.query;

        let filteredFAQs = advertiserFAQs;

        if (category) {
            filteredFAQs = advertiserFAQs.filter(faq => faq.category === category);
        }

        res.json({
            success: true,
            categories: faqCategories,
            faqs: filteredFAQs
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch FAQs'
        });
    }
});

export default router;