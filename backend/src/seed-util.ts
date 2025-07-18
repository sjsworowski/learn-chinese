import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Vocabulary } from './entities/vocabulary.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SessionProgress } from './entities/session-progress.entity';
import { TestSession } from './entities/test-session.entity';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

export async function seedDatabaseIfNeeded(dataSource: DataSource) {
    const userRepo = dataSource.getRepository(User);
    const vocabRepo = dataSource.getRepository(Vocabulary);

    // Check if already seeded (e.g., if any users exist)
    const userCount = await userRepo.count();
    if (userCount > 0) {
    }
    else {
        // Seed demo user
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
    }

    const vocabCount = await vocabRepo.count();
    if (vocabCount > 0) {
    }
    else {
        // Seed vocabulary
        const vocabPath = path.join(__dirname, 'vocab.json');
        const vocabJson = fs.readFileSync(vocabPath, 'utf-8');
        const vocabularyData = JSON.parse(vocabJson);

        for (const vocabData of vocabularyData) {
            if (!('imageUrl' in vocabData)) {
                vocabData.imageUrl = '';
            }
            const existingVocab = await vocabRepo.findOne({
                where: { chinese: vocabData.chinese }
            });
            if (!existingVocab) {
                const vocab = vocabRepo.create(vocabData);
                await vocabRepo.save(vocab);
                console.log(`Vocabulary "${vocabData.chinese}" created`);
            }
        }
    }

    console.log('Database seeded successfully!');
} 