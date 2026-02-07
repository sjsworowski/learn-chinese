import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class CronSecretGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const secret = this.configService.get<string>('CRON_SECRET');
        const provided =
            request.headers['x-cron-secret'] ||
            request.headers['authorization']?.replace(/^Bearer\s+/i, '');

        if (!secret) {
            throw new UnauthorizedException(
                'CRON_SECRET is not configured. Set CRON_SECRET in the environment and call this endpoint with header X-Cron-Secret.',
            );
        }
        if (provided !== secret) {
            throw new UnauthorizedException('Invalid cron secret');
        }
        return true;
    }
}
