export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    keywords: string[];
}

export const advertiserFAQs: FAQ[] = [
    // Pricing & Packages
    {
        id: 'faq-1',
        question: 'What are your advertising rates?',
        answer: 'We offer flexible advertising packages tailored to your needs:\n\n• **Banner Ads**: $500-$2,000/month depending on placement\n• **Newsletter Sponsorship**: $1,500/month (reaches 50,000+ subscribers)\n• **Content Partnership**: $3,000-$5,000/month (sponsored articles + social media)\n• **Annual Packages**: 15% discount on 12-month commitments\n\nAll packages include performance analytics and quarterly reports.',
        category: 'pricing',
        keywords: ['price', 'cost', 'rate', 'pricing', 'how much', 'package', 'plan']
    },
    {
        id: 'faq-2',
        question: 'Do you offer discounts for non-profit organizations?',
        answer: 'Yes! We provide special pricing for qualified non-profits in the healthcare and transplant sectors:\n\n• **20% discount** on all advertising packages\n• **Free** PSA placement (subject to availability)\n• **Complimentary** quarterly feature in our newsletter\n\nNon-profits must provide 501(c)(3) documentation to qualify.',
        category: 'pricing',
        keywords: ['discount', 'non-profit', 'nonprofit', 'charity', '501c3', 'reduced rate']
    },
    {
        id: 'faq-3',
        question: 'What payment methods do you accept?',
        answer: 'We accept the following payment methods:\n\n• Credit/Debit Cards (Visa, Mastercard, Amex, Discover)\n• ACH Bank Transfer\n• Wire Transfer (for international clients)\n• Purchase Orders (for qualified businesses)\n\nPayment terms: Net 30 for established clients, prepayment for new advertisers.',
        category: 'pricing',
        keywords: ['payment', 'pay', 'invoice', 'billing', 'credit card', 'wire transfer']
    },

    // Audience & Reach
    {
        id: 'faq-4',
        question: 'What is your website traffic and audience demographics?',
        answer: 'MatchingDonors.com reaches a highly engaged medical audience:\n\n**Monthly Traffic:**\n• 500,000+ unique visitors\n• 1.2 million page views\n• Average session: 4.5 minutes\n\n**Audience Demographics:**\n• 60% patients/families seeking transplants\n• 25% potential living donors\n• 15% healthcare professionals\n• Age: 35-65 (70% of visitors)\n• Income: $50K+ (65% of visitors)\n• Education: College degree or higher (75%)',
        category: 'audience',
        keywords: ['traffic', 'visitors', 'audience', 'demographics', 'reach', 'users', 'who visits']
    },
    {
        id: 'faq-5',
        question: 'What related websites do you operate?',
        answer: 'We operate a network of targeted medical information sites:\n\n• **DailyDiabetesNews.com** - 200K monthly visitors\n• **DailyTransplantNews.com** - 150K monthly visitors\n• **IrishDailyTransplantNews.com** - 50K monthly visitors\n\n**Combined Network Reach:**\n• 900,000+ total monthly visitors\n• Cross-promotion opportunities available\n• Bundle discounts for multi-site campaigns',
        category: 'audience',
        keywords: ['sites', 'websites', 'network', 'other sites', 'daily diabetes', 'daily transplant']
    },
    {
        id: 'faq-6',
        question: 'What email newsletter reach do you have?',
        answer: 'Our newsletter program delivers targeted content to engaged subscribers:\n\n• **MatchingDonors Newsletter**: 50,000 subscribers\n• **Diabetes Health Update**: 35,000 subscribers\n• **Transplant News Weekly**: 25,000 subscribers\n\n**Performance Metrics:**\n• Average open rate: 28-32%\n• Average click-through rate: 4-6%\n• Delivered weekly on Thursdays\n\nSponsorship includes banner placement, text ad, and dedicated feature.',
        category: 'audience',
        keywords: ['newsletter', 'email', 'subscribers', 'mailing list', 'e-mail']
    },

    // Ad Placement & Format
    {
        id: 'faq-7',
        question: 'What ad formats and placements do you offer?',
        answer: 'We offer multiple high-visibility ad placements:\n\n**Display Ads:**\n• Header Banner (728x90) - Premium placement\n• Sidebar (300x250) - High engagement\n• Article Footer (728x90) - Content-adjacent\n\n**Native Ads:**\n• Sponsored Articles - Branded content\n• In-Feed Stories - Blended placement\n\n**Email:**\n• Newsletter Banner\n• Dedicated Email Blast (premium)\n\nAll ads are mobile-responsive and professionally designed.',
        category: 'placement',
        keywords: ['placement', 'format', 'banner', 'ad type', 'display', 'where', 'position']
    },
    {
        id: 'faq-8',
        question: 'Can you help with ad design and creative?',
        answer: 'Yes! We offer comprehensive creative services:\n\n**Included FREE with all packages:**\n• Banner ad design (up to 3 sizes)\n• Basic copywriting\n• Stock image licensing\n• A/B testing of 2 variations\n\n**Premium Creative Services (additional cost):**\n• Custom photography/videography\n• Animated/interactive ads\n• Landing page development\n• Multi-campaign content strategy\n\nOur in-house design team has 15+ years in healthcare marketing.',
        category: 'placement',
        keywords: ['design', 'creative', 'artwork', 'make ad', 'create', 'help design']
    },

    // Performance & Analytics
    {
        id: 'faq-9',
        question: 'What kind of reporting and analytics do you provide?',
        answer: 'We provide comprehensive campaign analytics:\n\n**Monthly Reports Include:**\n• Impressions and reach\n• Click-through rates (CTR)\n• Conversions and goals\n• Audience demographics\n• Geographic breakdown\n• Device type analysis\n\n**Access:**\n• Real-time dashboard (24/7 access)\n• Monthly PDF reports\n• Quarterly business review calls\n• Google Analytics integration available',
        category: 'analytics',
        keywords: ['reporting', 'analytics', 'metrics', 'performance', 'data', 'results', 'stats']
    },
    {
        id: 'faq-10',
        question: 'What is your average click-through rate (CTR)?',
        answer: 'Our ad performance consistently exceeds industry benchmarks:\n\n**Average CTR by Format:**\n• Banner Ads: 0.8-1.2% (industry avg: 0.35%)\n• Native Ads: 2.5-4.0% (industry avg: 0.8%)\n• Newsletter Ads: 4-6% (industry avg: 2.5%)\n\n**Why Our CTR is Higher:**\n• Highly targeted audience with specific intent\n• Medical/healthcare focus attracts relevant advertisers\n• Quality content drives engagement\n• Regular A/B testing optimization',
        category: 'analytics',
        keywords: ['ctr', 'click through', 'click-through', 'performance', 'conversion', 'effectiveness']
    },

    // Campaign Setup & Timeline
    {
        id: 'faq-11',
        question: 'How long does it take to launch an ad campaign?',
        answer: 'Our streamlined process gets you live quickly:\n\n**Typical Timeline:**\n• **Days 1-2**: Contract and payment processing\n• **Days 3-5**: Creative development and approval\n• **Day 6**: Campaign setup and testing\n• **Day 7**: Launch!\n\n**Rush Service Available:**\n• 48-hour launch: +$500 fee\n• Requires pre-approved creative assets\n\nWe recommend starting 2 weeks before your desired launch date for optimal results.',
        category: 'process',
        keywords: ['timeline', 'how long', 'start', 'launch', 'when', 'setup time', 'begin']
    },
    {
        id: 'faq-12',
        question: 'What is your ad approval process?',
        answer: 'We maintain quality standards while ensuring quick approval:\n\n**Approval Process:**\n1. Submit ad creative and copy\n2. Review within 24 business hours\n3. Feedback or approval notification\n4. Revisions (if needed)\n5. Final approval and scheduling\n\n**We Do NOT Accept:**\n• Misleading medical claims\n• Competitor attack ads\n• Adult content or gambling\n• Political/religious content\n• Anything violating FDA/FTC guidelines\n\nAll ads must comply with healthcare advertising regulations.',
        category: 'process',
        keywords: ['approval', 'review', 'guidelines', 'restrictions', 'policy', 'accept', 'allowed']
    },

    // Industries & Targeting
    {
        id: 'faq-13',
        question: 'What types of advertisers do you work with?',
        answer: 'We partner with a variety of healthcare-related organizations:\n\n**Primary Advertisers:**\n• Pharmaceutical companies (immunosuppressants, diabetes medications)\n• Medical device manufacturers (dialysis, glucose monitors)\n• Healthcare providers (transplant centers, hospitals)\n• Insurance companies (Medicare, specialty health plans)\n• Non-profits (organ donation advocacy, patient support)\n• Medical education (conferences, CME programs)\n\n**Recent Clients Include:**\n• Major transplant centers nationwide\n• Diabetes care brands\n• Patient advocacy organizations\n• Medical research institutions',
        category: 'targeting',
        keywords: ['who advertises', 'clients', 'industries', 'types', 'work with', 'partner']
    },
    {
        id: 'faq-14',
        question: 'Can I target specific audiences or geographic regions?',
        answer: 'Yes! We offer advanced targeting options:\n\n**Geographic Targeting:**\n• Country-level (US, UK, Ireland, Canada, etc.)\n• State/Province level\n• DMA (Designated Market Area)\n• Custom ZIP code lists\n\n**Audience Targeting:**\n• Patients vs. Donors\n• Organ type (kidney, liver, heart, etc.)\n• Condition (diabetes, kidney disease, etc.)\n• Newsletter segment targeting\n\n**Device Targeting:**\n• Desktop only, mobile only, or both\n• iOS vs. Android (for mobile)\n\nTargeting adds 10-20% to base pricing depending on specificity.',
        category: 'targeting',
        keywords: ['targeting', 'geographic', 'location', 'audience', 'segment', 'specific']
    },

    // Contract & Terms
    {
        id: 'faq-15',
        question: 'What are your contract terms and minimum commitment?',
        answer: 'We offer flexible terms to match your needs:\n\n**Contract Options:**\n• Month-to-Month: No long-term commitment, cancel anytime with 30 days notice\n• 3-Month: 5% discount, great for testing\n• 6-Month: 10% discount, most popular\n• 12-Month: 15% discount, best value\n\n**Minimum Spend:**\n• $500/month for banner ads\n• $1,500/month for newsletter sponsorship\n• $3,000/month for content partnerships\n\n**Cancellation Policy:**\n• 30 days written notice required\n• Pro-rated refunds for annual contracts (after 90 days)\n• No cancellation fees',
        category: 'contract',
        keywords: ['contract', 'term', 'commitment', 'minimum', 'cancel', 'cancellation', 'agreement']
    },
    {
        id: 'faq-16',
        question: 'Do you offer trial campaigns or pilot programs?',
        answer: 'Yes! We understand you want to test before committing:\n\n**Trial Program Options:**\n\n**Option 1 - Discounted Trial Month:**\n• 30-day campaign at 25% discount\n• Choose any ad format\n• Full analytics and reporting\n• No obligation to continue\n• Converts to month-to-month if satisfied\n\n**Option 2 - Pilot Campaign:**\n• $1,000 minimum spend\n• Test multiple placements\n• 14-day duration\n• Basic reporting included\n\n**Great for:**\n• First-time medical advertisers\n• Budget validation\n• Creative testing\n• ROI proof for stakeholders',
        category: 'contract',
        keywords: ['trial', 'test', 'pilot', 'try', 'sample', 'demo campaign']
    },

    // Support & Contact
    {
        id: 'faq-17',
        question: 'Who will manage my account and how do I get support?',
        answer: 'You\'ll receive dedicated support throughout your campaign:\n\n**Your Account Team:**\n• Dedicated Account Manager (for campaigns >$2K/month)\n• Email response within 4 business hours\n• Phone support during business hours (9am-5pm EST)\n• Quarterly business review calls\n\n**Support Channels:**\n• Email: advertising@matchingdonors.com\n• Phone: 1-800-XXX-XXXX\n• Online dashboard with ticket system\n• Emergency contact for critical issues\n\n**Business Hours:**\n• Monday-Friday, 9am-5pm EST\n• After-hours email support for urgent matters',
        category: 'support',
        keywords: ['support', 'contact', 'help', 'account manager', 'reach', 'phone', 'email']
    },

    // Getting Started
    {
        id: 'faq-18',
        question: 'How do I get started with advertising on your platform?',
        answer: 'Getting started is easy! Follow these simple steps:\n\n**Step 1: Initial Consultation**\n• Fill out our advertiser inquiry form\n• Schedule a 30-minute discovery call\n• Discuss your goals and budget\n\n**Step 2: Proposal & Agreement**\n• Receive custom proposal within 2 business days\n• Review pricing and placement options\n• Sign agreement and submit payment\n\n**Step 3: Campaign Development**\n• Work with creative team on ad design\n• Review and approve final materials\n• Set up tracking and analytics\n\n**Step 4: Launch!**\n• Campaign goes live on scheduled date\n• Receive confirmation and dashboard access\n• Monitor performance in real-time\n\nReady to start? Let me collect some information from you!',
        category: 'getting-started',
        keywords: ['get started', 'start', 'begin', 'how to', 'sign up', 'onboarding', 'first step']
    }
];

export const faqCategories = [
    { id: 'pricing', name: 'Pricing & Packages', icon: '💰' },
    { id: 'audience', name: 'Audience & Reach', icon: '👥' },
    { id: 'placement', name: 'Ad Placement & Format', icon: '📺' },
    { id: 'analytics', name: 'Performance & Analytics', icon: '📊' },
    { id: 'process', name: 'Campaign Setup', icon: '⚙️' },
    { id: 'targeting', name: 'Targeting Options', icon: '🎯' },
    { id: 'contract', name: 'Contract & Terms', icon: '📄' },
    { id: 'support', name: 'Support & Contact', icon: '💬' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' }
];
