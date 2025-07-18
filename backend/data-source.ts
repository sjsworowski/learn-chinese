import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Vocabulary } from './src/entities/vocabulary.entity';
import { UserProgress } from './src/entities/user-progress.entity';
import { SessionProgress } from './src/entities/session-progress.entity';
import { TestSession } from './src/entities/test-session.entity';

export default new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'chinese_vocab',
    entities: [
        User,
        Vocabulary,
        UserProgress,
        SessionProgress,
        TestSession,
    ],
    migrations: ['src/migrations/*.ts'],
});

