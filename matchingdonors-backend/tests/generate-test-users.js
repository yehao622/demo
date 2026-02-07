const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database/matchingdonors.db');
const db = new Database(dbPath);

// [Same random data generators as before - copy from generate-test-users.js]
const firstNames = ['John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava', 'Robert', 'Isabella'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const organTypes = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas'];
const states = ['MA', 'NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH'];
const cities = {
    'MA': ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
    'NY': ['New York', 'Buffalo', 'Rochester', 'Albany'],
    'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
    'TX': ['Houston', 'Austin', 'Dallas', 'San Antonio'],
    'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    'IL': ['Chicago', 'Naperville', 'Aurora', 'Peoria'],
    'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
    'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo']
};

const medicalConditions = [
    'End-stage renal disease, on dialysis',
    'Chronic kidney disease stage 5',
    'Liver cirrhosis due to hepatitis',
    'Congestive heart failure',
    'Type 2 diabetes with complications',
    'Hypertension controlled with medication',
    'Non-smoker, healthy lifestyle',
    'Regular exercise, no chronic conditions'
];

const descriptions = [
    'Looking for a compatible match to improve quality of life.',
    'Willing to help someone in need through organ donation.',
    'Urgently seeking a donor match for transplant.',
    'Healthy individual interested in life-saving donation.',
    'Registered on waiting list, hopeful for a match.',
    'Motivated by personal experience to help others.',
    'Seeking compatible donor for scheduled transplant.',
    'Ready to donate and make a difference in someone\'s life.'
];

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomAge(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUser(role, index) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = `${role}${index}@demo.com`;
    const state = randomElement(states);
    const age = randomAge(25, 65);
    const isComplete = Math.random() > 0.3; // 70% complete, 30% incomplete

    return {
        email,
        password: 'password',
        firstName,
        lastName,
        role,
        name: `${firstName} ${lastName}`,
        type: role,
        blood_type: isComplete ? randomElement(bloodTypes) : '',
        age: isComplete ? age : 0,  // FIXED: Use 0 instead of null
        country: 'USA',
        state,
        city: randomElement(cities[state]),
        organ_type: isComplete ? randomElement(organTypes) : '',
        description: randomElement(descriptions),
        medical_info: isComplete ? randomElement(medicalConditions) : '',
        preferences: isComplete ? `Preferred contact: email, Age preference: ${age - 10}-${age + 10}` : '',
        is_complete: isComplete ? 1 : 0
    };
}

async function setupTestData() {
    console.log('🔄 Setting up test data...\n');

    // Step 1: Reset database
    console.log('🗑️  Clearing existing data...');
    try {
        const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

        if (userCount > 0 || profileCount > 0) {
            db.prepare('DELETE FROM profiles').run();
            db.prepare('DELETE FROM users').run();
            db.prepare('DELETE FROM sqlite_sequence WHERE name="users"').run();
            db.prepare('DELETE FROM sqlite_sequence WHERE name="profiles"').run();
            console.log(`✅ Cleared ${userCount} users and ${profileCount} profiles\n`);
        } else {
            console.log('✅ Database already empty\n');
        }
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        return;
    }

    // Step 2: Generate test users
    console.log('🚀 Generating 20 test users...\n');

    const hashedPassword = await bcrypt.hash('password', 10);
    let patientsCreated = 0;
    let donorsCreated = 0;

    // Generate 10 patients
    console.log('👥 Creating 10 patients...');
    for (let i = 1; i <= 10; i++) {
        const userData = generateUser('patient', i);

        try {
            // Insert user
            const userInsert = db.prepare(`
                INSERT INTO users (email, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?)
            `);
            const userResult = userInsert.run(
                userData.email,
                hashedPassword,
                userData.firstName,
                userData.lastName,
                userData.role
            );
            const userId = userResult.lastInsertRowid;

            // Insert profile
            const profileId = `user-${userData.type}-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const profileInsert = db.prepare(`
                INSERT INTO profiles (
                    id, user_id, name, type, blood_type, age, country, state,
                    city, organ_type, description, medical_info, preferences, is_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            profileInsert.run(
                profileId,
                userId,
                userData.name,
                userData.type,
                userData.blood_type,
                userData.age,
                userData.country,
                userData.state,
                userData.city,
                userData.organ_type,
                userData.description,
                userData.medical_info,
                userData.preferences,
                userData.is_complete
            );

            patientsCreated++;
            console.log(`✅ ${userData.name} (${userData.email}) - ${userData.is_complete ? 'Complete ✓' : 'Incomplete ✗'}`);
        } catch (error) {
            console.error(`❌ Error creating patient${i}:`, error.message);
        }
    }

    console.log('\n💉 Creating 10 donors...');
    // Generate 10 donors
    for (let i = 1; i <= 10; i++) {
        const userData = generateUser('donor', i);

        try {
            const userInsert = db.prepare(`
                INSERT INTO users (email, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?)
            `);
            const userResult = userInsert.run(
                userData.email,
                hashedPassword,
                userData.firstName,
                userData.lastName,
                userData.role
            );
            const userId = userResult.lastInsertRowid;

            const profileId = `user-${userData.type}-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const profileInsert = db.prepare(`
                INSERT INTO profiles (
                    id, user_id, name, type, blood_type, age, country, state,
                    city, organ_type, description, medical_info, preferences, is_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            profileInsert.run(
                profileId,
                userId,
                userData.name,
                userData.type,
                userData.blood_type,
                userData.age,
                userData.country,
                userData.state,
                userData.city,
                userData.organ_type,
                userData.description,
                userData.medical_info,
                userData.preferences,
                userData.is_complete
            );

            donorsCreated++;
            console.log(`✅ ${userData.name} (${userData.email}) - ${userData.is_complete ? 'Complete ✓' : 'Incomplete ✗'}`);
        } catch (error) {
            console.error(`❌ Error creating donor${i}:`, error.message);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Patients: ${patientsCreated}/10`);
    console.log(`   Donors: ${donorsCreated}/10`);
    console.log(`   Total: ${patientsCreated + donorsCreated}/20`);
    console.log('\n✨ Setup complete!');
    console.log('🔑 All passwords: password');
    console.log('\n🧪 Test any user:');
    console.log('   patient1@demo.com through patient10@demo.com');
    console.log('   donor1@demo.com through donor10@demo.com');

    db.close();
}

setupTestData().catch(console.error);
