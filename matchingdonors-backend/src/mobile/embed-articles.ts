import dotenv from 'dotenv';
dotenv.config();

import db from '../database/init';
import { MatchingService } from '../matching/matching.service';

async function embedExistingArticles() {
    console.log('📰 Fetching articles from database...');

    // Initialize your Gemini service
    const matchingService = new MatchingService();

    // Find all articles that are missing an embedding
    const articles = db.prepare(`
        SELECT id, title, summary 
        FROM articles 
        WHERE embedding IS NULL
    `).all() as any[];

    if (articles.length === 0) {
        console.log('✅ All articles already have AI embeddings!');
        return;
    }

    console.log(`🧠 Generating AI embeddings for ${articles.length} articles. This may take a minute...`);

    const updateStmt = db.prepare(`
        UPDATE articles 
        SET embedding = ? 
        WHERE id = ?
    `);

    for (const article of articles) {
        try {
            // Combine the title and summary so Gemini understands what the article is about
            const textToEmbed = `${article.title}. ${article.summary}`;

            // Generate the 768-dimension vector
            const embedding = await matchingService.generateEmbedding(textToEmbed);

            // Save it to the database
            updateStmt.run(JSON.stringify(embedding), article.id);
            console.log(`✅ Embedded: ${article.title}`);
        } catch (error) {
            console.error(`❌ Failed to embed article ${article.id}:`, error);
        }
    }

    console.log('🎉 Article AI embedding complete! Your mobile News Feed is now fully personalized.');
}

embedExistingArticles();