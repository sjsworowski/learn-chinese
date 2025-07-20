import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedDatabaseIfNeeded } from './seed-util';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
    await app.listen(process.env.PORT || 3001);
    console.log(`Application is running on: http://localhost:${process.env.PORT || 3001}`);
}
bootstrap();