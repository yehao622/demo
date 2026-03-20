import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from './database/init';
import { MatchingService } from './matching/matching.service';

async function seedDatabase() {
    console.log('🌱 Starting database seed...');

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password', saltRounds);

    // Added the MatchingService instance
    const matchingService = new MatchingService();

    // Array of realistic demo users
    // We use 'any' here or explicitly define the type to satisfy TypeScript when adding the embedding later
    const demoUsers: any[] = [
        {
            email: 'patient2@demo.com', firstName: 'Sarah', lastName: 'Jenkins', role: 'patient',
            profile: {
                organ_type: 'Kidney', blood_type: 'O+', age: 45, city: 'Boston', state: 'MA', country: 'USA',
                description: 'Mother of two looking for a kidney donor to get back to an active life.',
                medical_info: 'Diagnosed with Stage 4 CKD two years ago. Currently on dialysis 3 times a week. Otherwise healthy with no history of smoking.',
                preferences: 'Hoping for a local donor in the New England area to simplify hospital logistics.',
                is_public: 1
            }
        },
        {
            email: 'patient3@demo.com', firstName: 'David', lastName: 'Chen', role: 'patient',
            profile: {
                organ_type: 'Bone Marrow', blood_type: 'AB+', age: 28, city: 'Chicago', state: 'IL', country: 'USA',
                description: 'Recent college grad fighting leukemia.',
                medical_info: 'Diagnosed with Acute Myeloid Leukemia (AML). Chemotherapy has not resulted in full remission. Urgent need for a bone marrow match.',
                preferences: 'Willing to travel anywhere in the US for the procedure.',
                is_public: 1
            }
        },
        {
            email: 'patient4@demo.com', firstName: 'Maria', lastName: 'Garcia', role: 'patient',
            profile: {
                organ_type: 'Lung', blood_type: 'A-', age: 60, city: 'Miami', state: 'FL', country: 'USA',
                description: 'Retired teacher seeking a single lung transplant.',
                medical_info: 'Suffering from severe COPD. Oxygen dependent for the last 18 months. Good cardiac health.',
                preferences: 'Prefer a non-smoking donor.',
                is_public: 1
            }
        },

        // --- DONORS ---
        {
            email: 'donor2@demo.com', firstName: 'Michael', lastName: 'Oates', role: 'donor',
            profile: {
                organ_type: 'Kidney', blood_type: 'O-', age: 32, city: 'Providence', state: 'RI', country: 'USA',
                description: 'Healthy marathon runner wanting to give the gift of life.',
                medical_info: 'Perfect health. Universal donor (O-). Never smoked, minimal alcohol consumption. Cleared by initial psychological evaluation for living donation.',
                preferences: 'Would love to donate to a parent or someone with young children.',
                is_public: 1
            }
        },
        {
            email: 'donor3@demo.com', firstName: 'Jessica', lastName: 'Smith', role: 'donor',
            profile: {
                organ_type: 'Bone Marrow', blood_type: 'AB-', age: 29, city: 'Chicago', state: 'IL', country: 'USA',
                description: 'Registered nurse ready to donate marrow.',
                medical_info: 'Healthy female. Joined the registry in nursing school. No underlying health conditions.',
                preferences: 'Local donation preferred but flexible.',
                is_public: 1
            }
        },
        {
            email: 'donor4@demo.com', firstName: 'Robert', lastName: 'Taylor', role: 'donor',
            profile: {
                organ_type: 'Liver', blood_type: 'B+', age: 50, city: 'Seattle', state: 'WA', country: 'USA',
                description: 'Willing to be a living liver donor (partial lobe).',
                medical_info: 'Type 2 diabetic, well-managed with diet. Cleared by primary care for partial liver donation.',
                preferences: 'Prefer to donate on the West Coast.',
                is_public: 1
            }
        }
    ];

    try {
        // 1. Generate all embeddings FIRST (since API calls are async)
        for (const u of demoUsers) {
            const profileText = `${u.profile.description} ${u.profile.medical_info} ${u.profile.organ_type} ${u.profile.preferences}`;
            u.profile.embedding = await matchingService.generateEmbedding(profileText);
        }

        // 2. Now run the synchronous database transaction
        const insertTransaction = db.transaction((users) => {
            // Clean up any old demo data before inserting fresh data
            db.prepare(`DELETE FROM users WHERE email LIKE '%@demo.com'`).run();

            const insertUser = db.prepare(`
                INSERT INTO users (email, password_hash, first_name, last_name, role) 
                VALUES (?, ?, ?, ?, ?)
            `);

            const insertProfile = db.prepare(`
                INSERT INTO profiles (id, user_id, name, type, organ_type, blood_type, age, city, state, country, description, medical_info, preferences, is_public, is_complete, embedding) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const u of users) {
                const userResult = insertUser.run(u.email, defaultPassword, u.firstName, u.lastName, u.role);
                const userId = userResult.lastInsertRowid;
                const profileId = crypto.randomUUID();
                const fullName = `${u.firstName} ${u.lastName}`;

                // Convert the embedding array to a JSON string for SQLite storage
                const embeddingString = JSON.stringify(u.profile.embedding);

                insertProfile.run(
                    profileId, userId, fullName, u.role, u.profile.organ_type, u.profile.blood_type, u.profile.age,
                    u.profile.city, u.profile.state, u.profile.country, u.profile.description, u.profile.medical_info,
                    u.profile.preferences, 1, 1,
                    embeddingString
                );
            }
        });

        insertTransaction(demoUsers);
        console.log('🎉 Database seeding complete! All passwords are set to: password');

    } catch (error) {
        console.error('❌ Error during database seeding:', error);
    }
}

seedDatabase();