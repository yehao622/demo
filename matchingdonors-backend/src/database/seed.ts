import db from './index';

interface ProfileData {
    id: string;
    name: string;
    type: 'patient' | 'donor';
    bloodType: string;
    age: number;
    country: string;
    state: string;
    city: string;
    organType: string;
    description: string;
    medicalInfo: string;
    preferences: string;
}

const profiles: ProfileData[] = [
    // US Patients
    {
        id: 'test-patient-001',
        name: 'John Doe',
        type: 'patient',
        bloodType: 'O+',
        age: 45,
        country: 'USA',
        state: 'Massachusetts',
        city: 'Boston',
        organType: 'Kidney',
        description: 'Patient seeking kidney transplant',
        medicalInfo: 'Blood type O+, age 45, kidney disease stage 4, non-smoker, Boston, MA',
        preferences: 'Looking for living donor, willing to travel within New England'
    },
    {
        id: 'test-patient-002',
        name: 'Maria Garcia',
        type: 'patient',
        bloodType: 'A-',
        age: 38,
        country: 'USA',
        state: 'New York',
        city: 'New York',
        organType: 'Liver',
        description: 'Liver transplant needed urgently',
        medicalInfo: 'Blood type A-, age 38, end-stage liver disease, non-smoker, New York NY',
        preferences: 'Seeking compatible donor, family available for support'
    },
    {
        id: 'test-patient-003',
        name: 'Robert Chen',
        type: 'patient',
        bloodType: 'B+',
        age: 52,
        country: 'USA',
        state: 'Illinois',
        city: 'Chicago',
        organType: 'Heart',
        description: 'Heart transplant candidate',
        medicalInfo: 'Blood type B+, age 52, congestive heart failure, healthy lifestyle, Chicago IL',
        preferences: 'Need urgent transplant, willing to relocate temporarily'
    },
    {
        id: 'test-patient-004',
        name: 'Emily Johnson',
        type: 'patient',
        bloodType: 'AB+',
        age: 28,
        country: 'USA',
        state: 'Washington',
        city: 'Seattle',
        organType: 'Kidney',
        description: 'Young patient needing kidney donor',
        medicalInfo: 'Blood type AB+, age 28, polycystic kidney disease, excellent health otherwise, Seattle WA',
        preferences: 'Looking for young healthy donor, willing to cover travel expenses'
    },
    {
        id: 'test-patient-005',
        name: 'David Martinez',
        type: 'patient',
        bloodType: 'O-',
        age: 44,
        country: 'USA',
        state: 'Colorado',
        city: 'Denver',
        organType: 'Lung',
        description: 'Lung transplant required',
        medicalInfo: 'Blood type O-, age 44, pulmonary fibrosis, non-smoker, Denver CO',
        preferences: 'Seeking donor match, family support available'
    },
    {
        id: 'test-patient-006',
        name: 'Sarah Williams',
        type: 'patient',
        bloodType: 'A+',
        age: 35,
        country: 'USA',
        state: 'Massachusetts',
        city: 'Boston',
        organType: 'Pancreas',
        description: 'Pancreas and kidney transplant needed',
        medicalInfo: 'Blood type A+, age 35, Type 1 diabetes complications, Boston MA',
        preferences: 'Looking for dual organ donor or separate donors'
    },
    // US Donors
    {
        id: 'test-donor-001',
        name: 'Jane Smith',
        type: 'donor',
        bloodType: 'O+',
        age: 32,
        country: 'USA',
        state: 'Massachusetts',
        city: 'Cambridge',
        organType: 'Kidney',
        description: 'Healthy kidney donor',
        medicalInfo: 'Blood type O+, age 32, excellent health, non-smoker, Cambridge MA',
        preferences: 'Willing to donate to compatible patient, can travel'
    },
    {
        id: 'test-donor-002',
        name: 'Michael Brown',
        type: 'donor',
        bloodType: 'A-',
        age: 29,
        country: 'USA',
        state: 'New York',
        city: 'New York',
        organType: 'Liver',
        description: 'Living liver donor volunteer',
        medicalInfo: 'Blood type A-, age 29, perfect health, athletic lifestyle, New York NY',
        preferences: 'Altruistic donor, willing to help those in need'
    },
    {
        id: 'test-donor-003',
        name: 'Lisa Anderson',
        type: 'donor',
        bloodType: 'B+',
        age: 40,
        country: 'USA',
        state: 'Illinois',
        city: 'Chicago',
        organType: 'Kidney',
        description: 'Kidney donor seeking recipient',
        medicalInfo: 'Blood type B+, age 40, excellent physical condition, non-smoker, Chicago IL',
        preferences: 'Prefer to help patient in Midwest region'
    },
    {
        id: 'test-donor-004',
        name: 'James Wilson',
        type: 'donor',
        bloodType: 'AB+',
        age: 35,
        country: 'USA',
        state: 'Washington',
        city: 'Seattle',
        organType: 'Kidney',
        description: 'Universal kidney donor',
        medicalInfo: 'Blood type AB+, age 35, exceptional health, marathon runner, Seattle WA',
        preferences: 'Willing to donate to any compatible patient nationwide'
    },
    {
        id: 'test-donor-005',
        name: 'Amanda Lee',
        type: 'donor',
        bloodType: 'O-',
        age: 26,
        country: 'USA',
        state: 'Colorado',
        city: 'Denver',
        organType: 'Liver',
        description: 'Living liver donor',
        medicalInfo: 'Blood type O-, age 26, perfect health records, non-smoker, Denver CO',
        preferences: 'Want to help save a life, flexible with location'
    },
    {
        id: 'test-donor-006',
        name: 'Christopher Davis',
        type: 'donor',
        bloodType: 'A+',
        age: 42,
        country: 'USA',
        state: 'Massachusetts',
        city: 'Boston',
        organType: 'Kidney',
        description: 'Altruistic kidney donor',
        medicalInfo: 'Blood type A+, age 42, healthy lifestyle, non-drinker non-smoker, Boston MA',
        preferences: 'Looking to help local patient, family history of kidney disease awareness'
    },
    {
        id: 'test-donor-007',
        name: 'Patricia Taylor',
        type: 'donor',
        bloodType: 'B-',
        age: 31,
        country: 'USA',
        state: 'Oregon',
        city: 'Portland',
        organType: 'Kidney',
        description: 'Directed kidney donor',
        medicalInfo: 'Blood type B-, age 31, excellent health, yoga instructor, Portland OR',
        preferences: 'Willing to travel anywhere in US, prefer younger recipients'
    },
    {
        id: 'test-donor-008',
        name: 'Steven Martinez',
        type: 'donor',
        bloodType: 'AB-',
        age: 38,
        country: 'USA',
        state: 'Florida',
        city: 'Miami',
        organType: 'Liver',
        description: 'Liver portion donor volunteer',
        medicalInfo: 'Blood type AB-, age 38, exceptional fitness, non-smoker, Miami FL',
        preferences: 'Can donate liver portion, seeking compatible patient'
    },
    // International Profiles
    {
        id: 'australia-patient-001',
        name: 'Sophie Anderson',
        type: 'patient',
        bloodType: 'B+',
        age: 28,
        country: 'Australia',
        state: 'New South Wales',
        city: 'Sydney',
        organType: 'Liver',
        description: 'Urgently need liver transplant, blood type B+',
        medicalInfo: 'Age 28, blood type B+, liver disease, non-smoker, otherwise healthy, in Sydney, New South Wales, Australia',
        preferences: 'Can travel to USA or Europe if needed'
    },
    {
        id: 'canada-donor-001',
        name: 'Michael Chen',
        type: 'donor',
        bloodType: 'O-',
        age: 35,
        country: 'Canada',
        state: 'Ontario',
        city: 'Toronto',
        organType: 'Kidney',
        description: 'Willing to donate kidney, blood type O-',
        medicalInfo: 'Age 35, blood type O-, healthy, non-smoker, willing to donate kidney, Toronto, Ontario in Canada',
        preferences: 'Can travel to USA or Europe if needed'
    },
    {
        id: 'uk-patient-001',
        name: 'Emily Thompson',
        type: 'patient',
        bloodType: 'A+',
        age: 42,
        country: 'UK',
        state: 'England',
        city: 'London',
        organType: 'Kidney',
        description: 'Seeking kidney donor, blood type A+',
        medicalInfo: 'Age 42, blood type A+, kidney failure, non-smoker, excellent health otherwise, London UK England',
        preferences: 'Prefer UK donor, willing to travel within Europe'
    },
    {
        id: 'germany-donor-001',
        name: 'Hans Mueller',
        type: 'donor',
        bloodType: 'AB+',
        age: 45,
        country: 'Germany',
        state: 'Bavaria',
        city: 'Munich',
        organType: 'Liver',
        description: 'Willing to donate liver segment, blood type AB+',
        medicalInfo: 'Age 45, blood type AB+, excellent health, non-smoker, regular exercise, Munich, Bavaria, Germany',
        preferences: 'Willing to help patients in EU countries'
    },
    {
        id: 'japan-donor-001',
        name: 'Yuki Tanaka',
        type: 'donor',
        bloodType: 'A-',
        age: 55,
        country: 'Japan',
        state: 'Tokyo',
        city: 'Tokyo',
        organType: 'Heart',
        description: 'Donate my heart, blood type A-',
        medicalInfo: 'Age 55, blood type A-, heart healthy, non-smoker, Tokyo, Japan',
        preferences: 'Seeking patient in Asia, willing to travel'
    },
    {
        id: 'india-donor-001',
        name: 'Priya Sharma',
        type: 'donor',
        bloodType: 'O+',
        age: 32,
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        organType: 'Kidney',
        description: 'Willing to donate kidney, blood type O+',
        medicalInfo: 'Age 32, blood type O+, excellent health, non-smoker, vegetarian diet, Mumbai, Maharashtra, India',
        preferences: 'Prefer helping patients in India, open to international if urgent'
    },
    {
        id: 'brazil-patient-001',
        name: 'Carlos Silva',
        type: 'patient',
        bloodType: 'B-',
        age: 38,
        country: 'Brazil',
        state: 'São Paulo',
        city: 'São Paulo',
        organType: 'Pancreas',
        description: 'Need pancreas transplant, blood type B-',
        medicalInfo: 'Age 38, blood type B-, pancreatic failure, diabetic, non-smoker, São Paulo, Brazil',
        preferences: 'Seeking donor in South America, willing to travel'
    },
    {
        id: 'china-donor-001',
        name: 'Li Wei',
        type: 'donor',
        bloodType: 'AB-',
        age: 40,
        country: 'China',
        state: 'Shanghai',
        city: 'Shanghai',
        organType: 'Lung',
        description: 'Willing to donate lung, blood type AB-',
        medicalInfo: 'Age 40, blood type AB-, excellent respiratory health, non-smoker, athlete, Shanghai, China',
        preferences: 'Can travel within Asia for donation'
    },
    {
        id: 'mexico-patient-001',
        name: 'Maria Garcia',
        type: 'patient',
        bloodType: 'O+',
        age: 47,
        country: 'Mexico',
        state: 'Jalisco',
        city: 'Guadalajara',
        organType: 'Kidney',
        description: 'Seeking kidney donor, blood type O+',
        medicalInfo: 'Age 47, blood type O+, chronic kidney disease, non-smoker, controlled diabetes, Guadalajara, Jalisco, Mexico',
        preferences: 'Prefer Mexican or US donor, bilingual Spanish/English'
    },
    {
        id: 'usa-patient-marrow-001',
        name: 'David Johnson',
        type: 'patient',
        bloodType: 'A+',
        age: 25,
        country: 'USA',
        state: 'New York',
        city: 'New York',
        organType: 'Marrow',
        description: 'Need bone marrow transplant, blood type A+',
        medicalInfo: 'Age 25, blood type A+, leukemia patient, non-smoker, fighting cancer, NYC, USA',
        preferences: 'Seeking bone marrow donor, HLA typing available'
    }
];

export async function seedDatabase() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    db.prepare('DELETE FROM profiles').run();
    console.log('  ✓ Cleared existing profiles');

    // Insert profiles
    const insertProfile = db.prepare(`
        INSERT INTO profiles (
            id, name, type, blood_type, age, country, state, city,
            organ_type, description, medical_info, preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((profiles: ProfileData[]) => {
        for (const profile of profiles) {
            insertProfile.run(
                profile.id,
                profile.name,
                profile.type,
                profile.bloodType,
                profile.age,
                profile.country,
                profile.state,
                profile.city,
                profile.organType,
                profile.description,
                profile.medicalInfo,
                profile.preferences
            );
        }
    });

    insertMany(profiles);
    console.log(`  ✓ Inserted ${profiles.length} profiles`);

    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
    console.log(`\n✅ Seed completed! Total profiles: ${count.count}`);
}

// Run seed if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Seed failed:', error);
            process.exit(1);
        });
}
