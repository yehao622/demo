import db from './init';

interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}

export function runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
        // Check if is_public column exists
        const tableInfo = db.pragma('table_info(profiles)') as ColumnInfo[];
        const hasIsPublic = tableInfo.some((col: ColumnInfo) => col.name === 'is_public');

        if (!hasIsPublic) {
            console.log('📝 Adding is_public column to profiles table...');
            db.exec(`
                ALTER TABLE profiles 
                ADD COLUMN is_public BOOLEAN DEFAULT 1;
            `);
            console.log('✅ Migration complete: is_public column added');
        }
        // else {
        //     console.log('✅ is_public column already exists');
        // }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
