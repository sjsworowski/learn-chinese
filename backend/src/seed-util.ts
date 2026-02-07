import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Vocabulary } from './entities/vocabulary.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SessionProgress } from './entities/session-progress.entity';
import { TestSession } from './entities/test-session.entity';
import * as fs from 'fs';
import * as path from 'path';

export async function seedDatabaseIfNeeded(dataSource: DataSource) {
    try {
        const userRepo = dataSource.getRepository(User);
        const vocabRepo = dataSource.getRepository(Vocabulary);

        // Check if already seeded (e.g., if any users exist)
        const userCount = await userRepo.count();
        console.log('Current user count:', userCount);

        // Always ensure demo user exists (with password for email/password auth)
        const demoEmail = 'test@example.com';
        const demoPassword = 'demo123'; // Change in production or use env
        const bcrypt = await import('bcryptjs');
        let user = await userRepo.findOne({ where: { email: demoEmail } });
        if (!user) {
            user = userRepo.create({
                email: demoEmail,
                username: 'DemoUser',
                password: await bcrypt.hash(demoPassword, 10),
                emailRemindersEnabled: true,
            });
            user = await userRepo.save(user);
            console.log('Demo user created with ID:', user.id);
        } else if (!user.password) {
            user.password = await bcrypt.hash(demoPassword, 10);
            await userRepo.save(user);
            console.log('Demo user password set');
        } else {
            console.log('Demo user already exists with ID:', user.id);
        }

        const vocabCount = await vocabRepo.count();
        console.log('Current vocab count:', vocabCount);

        if (vocabCount === 0) {
            // Seed vocabulary
            const vocabPath = path.join(process.cwd(), 'src', 'vocab.json');
            console.log('Vocab path:', vocabPath); // Debug log

            if (!fs.existsSync(vocabPath)) {
                console.error('Vocab file not found at:', vocabPath);
                return;
            }

            const vocabJson = fs.readFileSync(vocabPath, 'utf-8');
            const vocabularyData = JSON.parse(vocabJson);

            let createdCount = 0;
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
                    createdCount++;
                    console.log(`Vocabulary "${vocabData.chinese}" created`);
                }
            }
            console.log(`Created ${createdCount} vocabulary items`);
        } else {
            console.log('Vocabulary already exists, skipping seeding');
        }

        console.log('✅ Database seeding completed');
    } catch (err) {
        console.error('❌ Error during seeding:', err);
    }
}
