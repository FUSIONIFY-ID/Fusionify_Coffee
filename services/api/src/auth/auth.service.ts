import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AppLanguage,
  CustomerStatus,
  OtpChannel,
  OtpPurpose,
  PhoneCountry,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import {
  createOpaqueToken,
  createOtpCode,
  hashOpaqueToken,
  hashOtp,
  hashPassword,
  verifyPassword,
} from './crypto.util';
import { OtpDeliveryService } from './otp-delivery.service';
import { normalizeSupportedPhone } from './phone.util';
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
  RequestOtpInput,
  SupportedLanguage,
  SupportedOtpChannel,
  SupportedOtpPurpose,
  UpdateProfileInput,
  VerifyOtpInput,
} from './auth.types';

const otpLifetimeMs = 5 * 60 * 1000;
const verificationLifetimeMs = 10 * 60 * 1000;
const accessLifetimeMs = 15 * 60 * 1000;
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const resendWindowMs = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: OtpDeliveryService,
  ) {}

  async requestOtp(input: RequestOtpInput) {
    const purpose = input.purpose ?? 'REGISTER';
    const phone = normalizeSupportedPhone(input.country, input.phone);

    this.assertLanguage(input.language);
    this.assertChannel(input.channel);
    this.assertPurpose(purpose);

    if (purpose === 'REGISTER') {
      const existingUser = await this.prisma.customerUser.findUnique({
        where: { phoneE164: phone.e164 },
      });

      if (existingUser && existingUser.status !== CustomerStatus.DELETED) {
        throw new ConflictException(
          'An account already exists for this phone number.',
        );
      }
    }

    const latest = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneE164: phone.e164,
        purpose: purpose as OtpPurpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latest &&
      latest.createdAt.getTime() + resendWindowMs > Date.now()
    ) {
      throw new ConflictException('Please wait before requesting another OTP.');
    }

    await this.prisma.otpChallenge.updateMany({
      where: {
        phoneE164: phone.e164,
        purpose: purpose as OtpPurpose,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const code = createOtpCode();
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phoneCountry: phone.country as PhoneCountry,
        phoneE164: phone.e164,
        channel: input.channel as OtpChannel,
        purpose: purpose as OtpPurpose,
        language: input.language as AppLanguage,
        codeHash: hashOtp(phone.e164, purpose, code),
        expiresAt: new Date(Date.now() + otpLifetimeMs),
      },
    });

    try {
      await this.delivery.send({
        phoneE164: phone.e164,
        code,
        channel: input.channel,
        language: input.language,
        purpose,
      });
    } catch (error: unknown) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw error;
    }

    return {
      challengeId: challenge.id,
      phone: this.maskPhone(phone.e164),
      channel: challenge.channel,
      expiresInSeconds: Math.floor(otpLifetimeMs / 1000),
      resendAfterSeconds: Math.floor(resendWindowMs / 1000),
    };
  }

  async verifyOtp(input: VerifyOtpInput) {
    if (!/^\d{6}$/.test(input.code)) {
      throw new BadRequestException('OTP must contain 6 digits.');
    }

    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: input.challengeId },
    });

    if (!challenge || challenge.consumedAt) {
      throw new NotFoundException('OTP challenge is not available.');
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('OTP has expired.');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new BadRequestException('OTP attempt limit has been reached.');
    }

    const expected = hashOtp(
      challenge.phoneE164,
      challenge.purpose,
      input.code,
    );

    if (expected !== challenge.codeHash) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('OTP is incorrect.');
    }

    const verificationToken = createOpaqueToken();

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        verifiedAt: new Date(),
        verificationTokenHash: hashOpaqueToken(verificationToken),
        verificationExpiresAt: new Date(
          Date.now() + verificationLifetimeMs,
        ),
      },
    });

    return {
      challengeId: challenge.id,
      verificationToken,
      verified: true,
    };
  }

  async register(input: RegisterInput) {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: input.challengeId },
    });

    if (
      !challenge ||
      challenge.purpose !== OtpPurpose.REGISTER ||
      challenge.consumedAt ||
      !challenge.verifiedAt ||
      !challenge.verificationTokenHash ||
      !challenge.verificationExpiresAt ||
      challenge.verificationExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'Phone verification must be completed again.',
      );
    }

    if (
      hashOpaqueToken(input.verificationToken) !==
      challenge.verificationTokenHash
    ) {
      throw new UnauthorizedException('Phone verification token is invalid.');
    }

    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 2 || fullName.length > 80) {
      throw new BadRequestException('Enter a valid full name.');
    }

    const email = this.normalizeEmail(input.email);
    const preferredLanguage =
      (input.preferredLanguage as AppLanguage | undefined) ??
      challenge.language;
    const passwordHash = await hashPassword(input.password).catch(() => {
      throw new BadRequestException(
        'Password must contain between 8 and 128 characters.',
      );
    });

    const existing = await this.prisma.customerUser.findFirst({
      where: {
        OR: [
          { phoneE164: challenge.phoneE164 },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing && existing.status !== CustomerStatus.DELETED) {
      throw new ConflictException('This account already exists.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.customerUser.create({
        data: {
          fullName,
          phoneCountry: challenge.phoneCountry,
          phoneE164: challenge.phoneE164,
          phoneVerifiedAt: new Date(),
          email,
          passwordHash,
          preferredLanguage,
        },
      });

      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      return user;
    });

    return this.createSession(
      result.id,
      input.deviceName,
      input.platform,
    );
  }

  async login(input: LoginInput) {
    const login = input.login?.trim();
    if (!login) {
      throw new BadRequestException('Phone number or email is required.');
    }

    let user;

    if (login.includes('@')) {
      user = await this.prisma.customerUser.findUnique({
        where: { email: login.toLowerCase() },
      });
    } else {
      if (!input.country) {
        throw new BadRequestException(
          'Country is required when signing in with phone number.',
        );
      }
      const phone = normalizeSupportedPhone(input.country, login);
      user = await this.prisma.customerUser.findUnique({
        where: { phoneE164: phone.e164 },
      });
    }

    if (
      !user ||
      user.status !== CustomerStatus.ACTIVE ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    return this.createSession(
      user.id,
      input.deviceName,
      input.platform,
    );
  }

  async refresh(input: RefreshInput) {
    const refreshHash = hashOpaqueToken(input.refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: refreshHash },
    });

    if (
      !session ||
      session.revokedAt ||
      session.refreshExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const next = this.newSessionTokens();

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        accessTokenHash: next.accessTokenHash,
        refreshTokenHash: next.refreshTokenHash,
        accessExpiresAt: next.accessExpiresAt,
        refreshExpiresAt: next.refreshExpiresAt,
        deviceName: input.deviceName ?? session.deviceName,
        platform: input.platform ?? session.platform,
      },
    });

    return {
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      accessExpiresAt: next.accessExpiresAt,
      refreshExpiresAt: next.refreshExpiresAt,
    };
  }

  async getUserForAccessToken(accessToken: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { accessTokenHash: hashOpaqueToken(accessToken) },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.accessExpiresAt.getTime() <= Date.now() ||
      session.user.status !== CustomerStatus.ACTIVE
    ) {
      return null;
    }

    return { session, user: session.user };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.customerUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    return this.toProfile(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: {
      fullName?: string;
      email?: string | null;
      birthDate?: Date | null;
      preferredLanguage?: AppLanguage;
    } = {};

    if (input.fullName !== undefined) {
      const fullName = input.fullName.trim();
      if (fullName.length < 2 || fullName.length > 80) {
        throw new BadRequestException('Enter a valid full name.');
      }
      data.fullName = fullName;
    }

    if (input.email !== undefined) {
      data.email = this.normalizeEmail(input.email ?? undefined);
    }

    if (input.birthDate !== undefined) {
      if (input.birthDate === null) {
        data.birthDate = null;
      } else {
        const date = new Date(input.birthDate);
        if (Number.isNaN(date.getTime()) || date >= new Date()) {
          throw new BadRequestException('Birth date is invalid.');
        }
        data.birthDate = date;
      }
    }

    if (input.preferredLanguage !== undefined) {
      this.assertLanguage(input.preferredLanguage);
      data.preferredLanguage = input.preferredLanguage as AppLanguage;
    }

    try {
      const user = await this.prisma.customerUser.update({
        where: { id: userId },
        data,
      });
      return this.toProfile(user);
    } catch {
      throw new ConflictException('Profile update could not be saved.');
    }
  }

  async logout(sessionId: string) {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async createSession(
    userId: string,
    deviceName?: string,
    platform?: string,
  ) {
    const tokens = this.newSessionTokens();

    await this.prisma.userSession.create({
      data: {
        userId,
        accessTokenHash: tokens.accessTokenHash,
        refreshTokenHash: tokens.refreshTokenHash,
        deviceName,
        platform,
        accessExpiresAt: tokens.accessExpiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
      },
    });

    const user = await this.getProfile(userId);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  }

  private newSessionTokens() {
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();

    return {
      accessToken,
      refreshToken,
      accessTokenHash: hashOpaqueToken(accessToken),
      refreshTokenHash: hashOpaqueToken(refreshToken),
      accessExpiresAt: new Date(Date.now() + accessLifetimeMs),
      refreshExpiresAt: new Date(Date.now() + refreshLifetimeMs),
    };
  }

  private normalizeEmail(value?: string) {
    if (value === undefined || value === '') {
      return null;
    }

    const email = value.trim().toLowerCase();
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BadRequestException('Email address is invalid.');
    }

    return email;
  }

  private toProfile(user: {
    id: string;
    fullName: string;
    phoneCountry: PhoneCountry;
    phoneE164: string;
    phoneVerifiedAt: Date;
    email: string | null;
    preferredLanguage: AppLanguage;
    birthDate: Date | null;
    avatarUrl: string | null;
    status: CustomerStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      phoneCountry: user.phoneCountry,
      phone: user.phoneE164,
      phoneVerified: true,
      phoneVerifiedAt: user.phoneVerifiedAt,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      status: user.status,
      memberSince: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private maskPhone(phone: string) {
    if (phone.length <= 7) {
      return phone;
    }
    return `${phone.substring(0, 5)}••••${phone.substring(phone.length - 3)}`;
  }

  private assertLanguage(value: SupportedLanguage) {
    if (!['ID_ID', 'MS_MY', 'EN'].includes(value)) {
      throw new BadRequestException('Unsupported language.');
    }
  }

  private assertChannel(value: SupportedOtpChannel) {
    if (!['WHATSAPP', 'SMS'].includes(value)) {
      throw new BadRequestException('Unsupported OTP channel.');
    }
  }

  private assertPurpose(value: SupportedOtpPurpose) {
    if (
      ![
        'REGISTER',
        'LOGIN_CHALLENGE',
        'RESET_PASSWORD',
        'CHANGE_PHONE',
        'DELETE_ACCOUNT',
      ].includes(value)
    ) {
      throw new BadRequestException('Unsupported OTP purpose.');
    }
  }
}
