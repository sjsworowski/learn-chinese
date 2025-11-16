// data-source.ts
import * as dotenv from 'dotenv';
dotenv.config(); // load .env early

import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Vocabulary } from './src/entities/vocabulary.entity';
import { UserProgress } from './src/entities/user-progress.entity';
import { SessionProgress } from './src/entities/session-progress.entity';
import { TestSession } from './src/entities/test-session.entity';
import { UserActivity } from './src/entities/user-activity.entity';
import { SpeedChallengeScore } from './src/entities/speed-challenge-score.entity';
import { UserMistake } from './src/entities/user-mistake.entity';
import { EmailReminder } from './src/entities/email-reminder.entity';

// Helper to parse port with fallback
const parsePort = (port?: string, fallback = 5432) =>
  port ? parseInt(port, 10) : fallback;

const useDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

if (!useDatabaseUrl) {
  // Validate individual env vars if DATABASE_URL is not used
  if (
    !process.env.POSTGRES_HOST ||
    !process.env.POSTGRES_USER ||
    !process.env.POSTGRES_PASSWORD ||
    !process.env.POSTGRES_DB
  ) {
    throw new Error(
      'One or more required Postgres environment variables (POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) are missing'
    );
  }
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
console.log('Using POSTGRES_HOST:', process.env.POSTGRES_HOST);

export default new DataSource(
  useDatabaseUrl
    ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // For Supabase and similar
      entities: [
        User,
        Vocabulary,
        UserProgress,
        SessionProgress,
        TestSession,
        UserActivity,
        SpeedChallengeScore,
        UserMistake,
        EmailReminder
      ],
      migrations: ['src/migrations/*.ts'],
    }
    : {
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parsePort(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: { rejectUnauthorized: false }, // Adjust as needed (true/false)
      entities: [
        User,
        Vocabulary,
        UserProgress,
        SessionProgress,
        TestSession,
        UserActivity,
        SpeedChallengeScore,
        UserMistake,
        EmailReminder
      ],
      migrations: ['src/migrations/*.ts'],
    }
);
