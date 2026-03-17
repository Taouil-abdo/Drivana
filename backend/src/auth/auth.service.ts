import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../entities/user.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Driver) private driverRepository: Repository<Driver>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash: hash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: (dto.role as Role) || Role.CLIENT,
    });

    await this.userRepository.save(user);

    const token = await this.signToken(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    return this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
      secret: this.config.get('JWT_SECRET'),
    });
  }

  async becomeDriver(
    userId: string,
    dto: {
      licenseNumber: string;
      experienceYears: number;
      photo?: string;
      licenseDocumentUrl?: string;
      insuranceDocumentUrl?: string;
    },
  ) {
    const existing = await this.driverRepository.findOne({ where: { user: { id: userId } } });
    if (existing) throw new ConflictException('Driver profile already exists');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const driver = this.driverRepository.create({
      user,
      licenseNumber: dto.licenseNumber,
      experienceYears: dto.experienceYears,
      photo: dto.photo,
      licenseDocumentUrl: dto.licenseDocumentUrl,
      insuranceDocumentUrl: dto.insuranceDocumentUrl,
      status: DriverStatus.PENDING,
    });
    await this.driverRepository.save(driver);
    return { message: 'Driver application submitted. Awaiting admin approval.' };
  }
}
