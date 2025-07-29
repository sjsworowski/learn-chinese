import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as nodemailer from "nodemailer";
import { User } from "../entities/user.entity";

const appJwtSecret = process.env.JWT_SECRET || 'fallback-secret';
console.log('🔐 MagicLinkService JWT_SECRET:', appJwtSecret);

@Injectable()
export class MagicLinkService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('EMAIL_USER and EMAIL_PASSWORD environment variables are required for magic link functionality');
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  async generateMagicLink(email: string): Promise<void> {
    const magicToken = this.jwtService.sign(
      { email, type: "magic-link" },
      { expiresIn: "15m" }
    );

    const loginUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${magicToken}`;
    await this.sendMagicLinkEmail(email, loginUrl);
  }

  private async sendMagicLinkEmail(email: string, loginUrl: string): Promise<void> {
    const transporter = this.getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Login to Learn Chinese",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #4f46e5;">Welcome to Learn Chinese!</h2><p>Click the button below to sign in to your account:</p><a href="${loginUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign In to Learn Chinese</a><p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p></div>`,
    };

    await transporter.sendMail(mailOptions);
  }

  async verifyMagicLink(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== "magic-link") {
        throw new Error("Invalid token type");
      }

      let user = await this.userRepository.findOne({
        where: { email: payload.email }
      });

      if (!user) {
        user = this.userRepository.create({
          email: payload.email,
          username: payload.email.split("@")[0],
          password: null,
        });
        await this.userRepository.save(user);
      }

      const sessionToken = this.jwtService.sign(
        { email: user.email, sub: user.id },
        { expiresIn: "30d" }
      );

      return {
        access_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      throw new Error("Invalid or expired magic link");
    }
  }
}
