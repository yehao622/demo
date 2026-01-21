import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import { TopicLabeler } from '../src/services/labeler/topicLabeler';
import { Article } from '../src/models/Article';

// Test article dataset with diverse scenarios
const testArticles: Article[] = [
    {
        id: 'test-1',
        source: 'dailytransplant',
        title: 'New Kidney Transplant Breakthrough Shows Promise',
        url: 'https://example.com/kidney-breakthrough',
        content: 'Researchers have discovered a new method to preserve kidney organs for transplantation, potentially extending viable storage time by 50%. This breakthrough could significantly impact patients with kidney disease awaiting transplantation. The study, conducted at major medical centers, shows promising results in early trials with improved organ viability and reduced rejection rates.',
        excerpt: 'New research extends kidney preservation time for transplants by 50%',
        publishDate: new Date('2026-01-15'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-2',
        source: 'dailydiabetes',
        title: 'Living with Type 1 Diabetes: Sarah\'s Inspiring Journey',
        url: 'https://example.com/sarah-diabetes-story',
        content: 'Sarah Johnson, 34, was diagnosed with Type 1 diabetes at age 12. After struggling with daily insulin management for over two decades, she recently received a pancreas transplant that has transformed her life. "I no longer have to check my blood sugar every hour," Sarah shares. "The transplant gave me my freedom back." Her story highlights the life-changing impact of organ donation for diabetes patients.',
        excerpt: 'Patient shares transformative experience after pancreas transplant for Type 1 diabetes',
        publishDate: new Date('2026-01-18'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-3',
        source: 'irishtransplant',
        title: 'Ireland Launches National Living Donor Awareness Campaign',
        url: 'https://example.com/ireland-donor-campaign',
        content: 'The Irish Department of Health has launched a nationwide campaign to increase awareness about living organ donation. The initiative aims to educate the public about the benefits and safety of living kidney and liver donation. Health Minister announced €2 million in funding for educational programs and support services for potential living donors and their families.',
        excerpt: 'New €2M campaign promotes living organ donation awareness across Ireland',
        publishDate: new Date('2026-01-10'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-4',
        source: 'dailytransplant',
        title: 'Heart Transplant Waiting List Reaches Record High',
        url: 'https://example.com/heart-waiting-list',
        content: 'According to the latest statistics from UNOS, the number of patients awaiting heart transplants has reached an all-time high of 3,800 nationwide. The shortage of donor hearts continues to be a critical issue, with average wait times exceeding 18 months. Medical experts emphasize the urgent need for more organ donors to address this growing crisis.',
        excerpt: 'Heart transplant waiting list hits record 3,800 patients nationwide',
        publishDate: new Date('2026-01-12'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-5',
        source: 'dailydiabetes',
        title: 'New Study Links Diabetes to Kidney Disease Progression',
        url: 'https://example.com/diabetes-kidney-study',
        content: 'A major 10-year research study published in the Journal of Nephrology reveals that poorly controlled diabetes significantly accelerates kidney disease progression. The study followed 5,000 patients with diabetes and found that those with HbA1c levels above 8% were three times more likely to develop end-stage renal disease requiring dialysis or transplantation.',
        excerpt: 'Decade-long research shows diabetes control crucial for preventing kidney failure',
        publishDate: new Date('2026-01-14'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-6',
        source: 'matchingdonors',
        title: 'Congress Passes Organ Donation Tax Credit Bill',
        url: 'https://example.com/organ-donation-tax-credit',
        content: 'In a landmark decision, Congress has passed legislation providing a $10,000 tax credit for living organ donors to cover lost wages, travel expenses, and medical costs. The bipartisan bill aims to remove financial barriers to living donation and increase the number of available organs for transplantation. Patient advocacy groups hail this as a major victory.',
        excerpt: 'New federal law offers $10K tax credit to living organ donors',
        publishDate: new Date('2026-01-20'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-7',
        source: 'dailytransplant',
        title: 'Father Donates Part of Liver to Save Daughter\'s Life',
        url: 'https://example.com/father-liver-donation',
        content: 'In an emotional story of parental love, 45-year-old Michael Chen donated a portion of his liver to his 8-year-old daughter Emma, who was born with a rare liver disease. The successful living donor liver transplant was performed at Children\'s Hospital, and both father and daughter are recovering well. Emma\'s mother said, "This donor registry connected us with information that saved our daughter\'s life."',
        excerpt: 'Living liver donation gives young girl second chance at life',
        publishDate: new Date('2026-01-16'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-8',
        source: 'dailydiabetes',
        title: 'Dialysis Patient Numbers Surge Amid Diabetes Epidemic',
        url: 'https://example.com/dialysis-diabetes-surge',
        content: 'New data from the CDC shows a 25% increase in dialysis patients over the past five years, with diabetes-related kidney failure being the leading cause. More than 500,000 Americans are now receiving regular dialysis treatment, with costs exceeding $90 billion annually. Healthcare experts call for better diabetes management and increased access to kidney transplantation.',
        excerpt: 'Diabetes-driven kidney failure fuels dialysis patient surge',
        publishDate: new Date('2026-01-11'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-9',
        source: 'dailytransplant',
        title: 'Charity Run Raises $500K for Organ Donation Awareness',
        url: 'https://example.com/charity-run-fundraiser',
        content: 'The annual "Run for Life" charity event brought together 10,000 participants across 20 cities, raising over $500,000 for organ donation awareness and transplant patient support programs. Many runners were transplant recipients, living donors, or family members of those waiting for organs. Event organizers plan to expand the initiative to 50 cities next year.',
        excerpt: 'National charity run generates half a million dollars for transplant cause',
        publishDate: new Date('2026-01-13'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-10',
        source: 'irishtransplant',
        title: 'Double Lung Transplant Success Rates Improve Significantly',
        url: 'https://example.com/lung-transplant-success',
        content: 'Irish medical teams report a significant improvement in double lung transplant outcomes, with 5-year survival rates now exceeding 60%. Advanced surgical techniques and improved immunosuppressive medications have contributed to these gains. The Mater Hospital performed 45 successful lung transplants last year, helping patients with cystic fibrosis, pulmonary hypertension, and chronic lung disease.',
        excerpt: 'New techniques boost lung transplant survival rates to record levels',
        publishDate: new Date('2026-01-17'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-11',
        source: 'matchingdonors',
        title: 'Celebrity Athlete Shares Pancreas Transplant Experience',
        url: 'https://example.com/athlete-pancreas-story',
        content: 'Former Olympic swimmer Marcus Thompson has gone public with his journey of receiving a pancreas and kidney transplant after battling diabetes complications for 15 years. The 38-year-old athlete is now advocating for organ donation and diabetes awareness. "Getting on the donor registry and finding a match saved my life," Thompson told reporters during a press conference.',
        excerpt: 'Olympic swimmer becomes advocate after life-saving transplant',
        publishDate: new Date('2026-01-19'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    },
    {
        id: 'test-12',
        source: 'dailydiabetes',
        title: 'Artificial Pancreas Technology Shows Promise in Clinical Trials',
        url: 'https://example.com/artificial-pancreas-trial',
        content: 'Researchers are testing a breakthrough artificial pancreas device that automatically monitors blood glucose and delivers insulin without patient intervention. The FDA-approved clinical trial involves 500 Type 1 diabetes patients across 30 medical centers. While not a replacement for transplantation, this technology could improve quality of life for millions living with diabetes.',
        excerpt: 'Automated insulin delivery system advances toward FDA approval',
        publishDate: new Date('2026-01-09'),
        crawledAt: new Date(),
        topics: [],
        organTypes: [],
        categories: []
    }
];

async function testTopicLabeling() {
    console.log('=================================');
    console.log('Topic Labeling Test Suite');
    console.log('=================================\n');
    console.log(`Testing ${testArticles.length} diverse articles...\n`);

    const labeler = new TopicLabeler(process.env.GEMINI_API_KEY || '');

    const labeledArticles = await labeler.labelArticles(testArticles);

    // Display results
    console.log('\n=================================');
    console.log('Detailed Test Results');
    console.log('=================================\n');

    labeledArticles.forEach((article, index) => {
        console.log(`[${index + 1}/${labeledArticles.length}] ${article.title}`);
        console.log(`   Source: ${article.source}`);
        console.log(`   Topics: ${article.topics.join(', ') || 'none'}`);
        console.log(`   Organs: ${article.organTypes.join(', ') || 'none'}`);
        console.log(`   Categories: ${article.categories.join(', ') || 'none'}`);
        console.log('');
    });

    // Generate statistics
    const stats = labeler.getStatistics(labeledArticles);

    console.log('=================================');
    console.log('Summary Statistics');
    console.log('=================================\n');
    console.log(`Total Articles: ${stats.totalArticles}`);
    console.log(`Labeled Articles: ${stats.labeledArticles}`);
    console.log(`Unlabeled Articles: ${stats.unlabeledArticles}`);
    console.log(`Success Rate: ${((stats.labeledArticles / stats.totalArticles) * 100).toFixed(1)}%\n`);

    console.log('Topic Distribution:');
    Object.entries(stats.topicDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([topic, count]) => {
            console.log(`  ${topic}: ${count}`);
        });

    console.log('\nOrgan Type Distribution:');
    Object.entries(stats.organDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([organ, count]) => {
            console.log(`  ${organ}: ${count}`);
        });

    console.log('\nCategory Distribution:');
    Object.entries(stats.categoryDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });

    console.log('\n=================================');
    console.log('✅ All tests completed successfully!');
    console.log('=================================');
}

testTopicLabeling().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
