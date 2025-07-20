import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Vocabulary } from './entities/vocabulary.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SessionProgress } from './entities/session-progress.entity';
import { TestSession } from './entities/test-session.entity';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
    entities: [User, Vocabulary, UserProgress, SessionProgress, TestSession],
    synchronize: false,
    logging: true,
});

async function seed() {
    await AppDataSource.initialize();

    await AppDataSource.synchronize();

    const userRepo = AppDataSource.getRepository(User);
    const vocabRepo = AppDataSource.getRepository(Vocabulary);

    const demoEmail = 'test@example.com';
    let user = await userRepo.findOne({ where: { email: demoEmail } });
    if (!user) {
        user = userRepo.create({
            email: demoEmail,
            username: 'DemoUser',
            password: await bcrypt.hash('password123', 10),
        });
        await userRepo.save(user);
        console.log('Demo user created');
    }

    // Load vocab from JSON
    const vocabPath = path.join(__dirname, 'vocab.json');
    const vocabJson = fs.readFileSync(vocabPath, 'utf-8');
    const vocabularyData = JSON.parse(vocabJson);

    for (const vocabData of vocabularyData) {
        // Ensure imageUrl is present and set to empty string if missing
        if (!('imageUrl' in vocabData)) {
            vocabData.imageUrl = '';
        }
        // Only insert if not already present
        const existingVocab = await vocabRepo.findOne({
            where: { chinese: vocabData.chinese }
        });
        if (!existingVocab) {
            const vocab = vocabRepo.create(vocabData);
            await vocabRepo.save(vocab);
            console.log(`Vocabulary "${vocabData.chinese}" created`);
        }
    }

    console.log('Database seeded successfully!');
    await AppDataSource.destroy();
}

seed().catch(error => {
    console.error('Error seeding database:', error);
    process.exit(1);
}); 