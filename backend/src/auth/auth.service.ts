import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;
    private readonly VERIFY_EXPIRY = '24h';

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || !user.password) return null;
        if (!user.emailVerified) {
            throw new UnauthorizedException('Please verify your email before signing in. Check your inbox for the verification link.');
        }
        const valid = await bcrypt.compare(password, user.password);
        return valid ? user : null;
    }

    async register(email: string, password: string, username?: string): Promise<{ message: string; email: string }> {
        const existing = await this.userRepository.findOne({ where: { email } });
        const displayName = username?.trim() || email.split('@')[0];
        if (existing) {
            if (existing.password) {
                throw new ConflictException('An account with this email already exists. Please sign in.');
            }
            const hashed = await bcrypt.hash(password, this.SALT_ROUNDS);
            existing.password = hashed;
            existing.username = displayName;
            existing.emailVerified = false;
            await this.userRepository.save(existing);
            await this.userRepository.update(existing.id, { emailVerified: false });
            await this.sendVerificationEmailOrThrow(existing);
            return { message: 'Check your email to verify your account before signing in.', email: existing.email };
        }
        const hashed = await bcrypt.hash(password, this.SALT_ROUNDS);
        const user = this.userRepository.create({
            email,
            username: displayName,
            password: hashed,
            emailVerified: false,
        });
        await this.userRepository.save(user);
        // Force DB to false (TypeORM can omit default-valued columns on INSERT; DB default was true)
        await this.userRepository.update(user.id, { emailVerified: false });
        await this.sendVerificationEmailOrThrow(user);
        return { message: 'Check your email to verify your account before signing in.', email: user.email };
    }

    private async sendVerificationEmailOrThrow(user: User): Promise<void> {
        try {
            await this.sendVerificationEmailForUser(user);
        } catch (err) {
            console.error('Failed to send verification email:', err);
            throw new BadRequestException(
                'We couldn\'t send the verification email. Please check your email address or try again later.'
            );
        }
    }

    private async sendVerificationEmailForUser(user: User): Promise<void> {
        const token = this.jwtService.sign(
            { sub: user.id, email: user.email, type: 'email-verify' },
            { expiresIn: this.VERIFY_EXPIRY }
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
        await this.emailService.sendVerificationEmail(user.email, verifyUrl);
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('No account found with this email.');
        }
        if (user.emailVerified) {
            throw new BadRequestException('This email is already verified. You can sign in.');
        }
        await this.sendVerificationEmailOrThrow(user);
        return { message: 'Verification email sent. Check your inbox.' };
    }

    async verifyEmail(token: string): Promise<{ access_token: string; user: any }> {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'email-verify') {
                throw new UnauthorizedException('Invalid verification link.');
            }
            const user = await this.userRepository.findOne({ where: { id: payload.sub } });
            if (!user) {
                throw new UnauthorizedException('Invalid verification link.');
            }
            user.emailVerified = true;
            await this.userRepository.save(user);
            return this.login(user, true);
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            throw new UnauthorizedException('Verification link expired or invalid. Please sign up again or request a new link.');
        }
    }

    async login(user: any, rememberMe?: boolean) {
        const payload = { email: user.email, sub: user.id };
        const expiresIn = rememberMe ? '90d' : '7d';
        return {
            access_token: this.jwtService.sign(payload, { expiresIn }),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }

    /** For "check your email" page: poll from any browser/tab to see if this email has been verified. */
    async getVerificationStatus(email: string): Promise<{ verified: boolean }> {
        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'emailVerified'],
        });
        return { verified: !!user?.emailVerified };
    }

    async findById(id: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
} 