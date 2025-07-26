import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedDatabaseIfNeeded } from './seed-util';
import helmet from 'helmet';
import { Logger } from '@nestjs/common';

const logger = new Logger('HTTP');

async function bootstrap() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const app = await NestFactory.create(AppModule);

    app.use(helmet());

    // Get TypeORM DataSource from DI container
    const dataSource = app.get(DataSource);

    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }

    // Seed the database if needed
    try {
        await seedDatabaseIfNeeded(dataSource);
    } catch (err) {
        console.error('Seeding failed:', err);
    }

    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://frontend:80',
            'https://learn-chinese-15859.web.app' // <-- Add your deployed frontend URL here
        ],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req, res, next) => {
        logger.log(`${req.method} ${req.url}`);
        next();
    });
    await app.listen(process.env.PORT || 3001);
    console.log(`Application is running on: http://localhost:${process.env.PORT || 3001}`);
}
bootstrap();