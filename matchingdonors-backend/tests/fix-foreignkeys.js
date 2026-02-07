const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database/matchingdonors.db');
const db = new Database(dbPath);

console.log('🔧 Fixing foreign key constraints...\n');

try {
    // Enable foreign keys
    db.pragma('foreign_keys = OFF'); // Temporarily disable to allow table recreation
    
    console.log('Step 1: Checking current profiles table...');
    
    // Check if profiles table has foreign key
    const tableInfo = db.pragma('foreign_key_list(profiles)');
    
    if (tableInfo.length > 0) {
        console.log('✅ Foreign key constraint already exists!');
        console.log('   Details:', tableInfo);
        db.close();
        return;
    }
    
    console.log('⚠️  No foreign key constraint found. Recreating table...\n');
    
    // Step 2: Create backup
    console.log('Step 2: Creating backup table...');
    db.exec(`
        CREATE TABLE profiles_backup AS SELECT * FROM profiles;
    `);
    console.log('✅ Backup created\n');
    
    // Step 3: Drop old table
    console.log('Step 3: Dropping old profiles table...');
    db.exec(`DROP TABLE profiles;`);
    console.log('✅ Old table dropped\n');
    
    // Step 4: Create new table WITH foreign key constraint
    console.log('Step 4: Creating new profiles table with foreign key...');
    db.exec(`
        CREATE TABLE profiles (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('patient', 'donor')),
            blood_type TEXT NOT NULL,
            age INTEGER NOT NULL,
            country TEXT NOT NULL,
            state TEXT NOT NULL,
            city TEXT NOT NULL,
            organ_type TEXT NOT NULL,
            description TEXT NOT NULL,
            medical_info TEXT NOT NULL,
            preferences TEXT NOT NULL,
            embedding TEXT,
            is_complete BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
        CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON profiles(blood_type);
        CREATE INDEX IF NOT EXISTS idx_profiles_organ_type ON profiles(organ_type);
        CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
        CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON profiles(is_complete);
    `);
    console.log('✅ New table created with ON DELETE CASCADE\n');
    
    // Step 5: Restore data
    console.log('Step 5: Restoring data from backup...');
    db.exec(`
        INSERT INTO profiles 
        SELECT * FROM profiles_backup;
    `);
    const count = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
    console.log(`✅ Restored ${count} profiles\n`);
    
    // Step 6: Drop backup
    console.log('Step 6: Cleaning up backup...');
    db.exec(`DROP TABLE profiles_backup;`);
    console.log('✅ Backup dropped\n');
    
    // Step 7: Re-enable foreign keys and verify
    db.pragma('foreign_keys = ON');
    const newTableInfo = db.pragma('foreign_key_list(profiles)');
    
    console.log('📊 Verification:');
    console.log('   Foreign key constraint:', newTableInfo.length > 0 ? '✅ ACTIVE' : '❌ MISSING');
    if (newTableInfo.length > 0) {
        console.log('   Details:', newTableInfo);
    }
    
    // Test the constraint
    const fkCheck = db.pragma('foreign_key_check');
    if (fkCheck.length === 0) {
        console.log('   Data integrity: ✅ PASSED');
    } else {
        console.log('   Data integrity: ⚠️  Issues found:', fkCheck);
    }
    
    console.log('\n🎉 Foreign key constraint successfully added!');
    console.log('\n💡 Test it:');
    console.log('   1. Delete a user from users table');
    console.log('   2. Their profile will automatically be deleted from profiles table');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  If backup exists, restore it:');
    console.log('   INSERT INTO profiles SELECT * FROM profiles_backup;');
    console.log('   DROP TABLE profiles_backup;');
} finally {
    db.close();
}

