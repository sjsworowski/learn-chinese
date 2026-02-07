import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    private getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('EMAIL_USER and EMAIL_PASSWORD environment variables are required for email functionality');
            }

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        }
        return this.transporter;
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const transporter = this.getTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
    }

    async sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
        const subject = 'Verify your email – Learn Chinese';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #111;">Verify your email address</h2>
                <p>Thanks for signing up. Please click the button below to verify your email and start learning.</p>
                <a href="${verifyUrl}"
                   style="display: inline-block; background-color: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Verify email address
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
            </div>
        `;
        await this.sendEmail(email, subject, html);
    }
} 