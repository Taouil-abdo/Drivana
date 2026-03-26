import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, Role } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
});

const mockDriverRepo = () => ({
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let driverRepo: ReturnType<typeof mockDriverRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User),   useFactory: mockUserRepo   },
        { provide: getRepositoryToken(Driver), useFactory: mockDriverRepo },
        { provide: JwtService,     useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: ConfigService,  useValue: { get: jest.fn().mockReturnValue('secret') } },
      ],
    }).compile();

    service    = module.get(AuthService);
    userRepo   = module.get(getRepositoryToken(User));
    driverRepo = module.get(getRepositoryToken(Driver));
  });

  describe('register', () => {
    const dto = { email: 'test@test.com', password: 'pass123', firstName: 'John', lastName: 'Doe' };

    it('should register a new user as CLIENT', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const fakeUser = { id: 'uuid-1', ...dto, role: Role.CLIENT, passwordHash: 'hash' };
      userRepo.create.mockReturnValue(fakeUser);
      userRepo.save.mockResolvedValue(fakeUser);

      const result = await service.register(dto);

      expect(result.user.role).toBe(Role.CLIENT);
      expect(result.token).toBe('token');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token on valid credentials', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      userRepo.findOne.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', passwordHash: hash, role: Role.CLIENT });

      const result = await service.login({ email: 'test@test.com', password: 'pass123' });
      expect(result.token).toBe('token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      userRepo.findOne.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', passwordHash: hash });

      await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'no@one.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('becomeDriver', () => {
    it('should create a driver application', async () => {
      driverRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });
      driverRepo.create.mockReturnValue({ id: 'driver-1' });
      driverRepo.save.mockResolvedValue({ id: 'driver-1' });

      const result = await service.becomeDriver('user-1', { licenseNumber: 'DL-123', experienceYears: 3 });
      expect(result.message).toContain('submitted');
    });

    it('should throw ConflictException if driver profile already exists', async () => {
      driverRepo.findOne.mockResolvedValue({ id: 'existing-driver' });
      await expect(service.becomeDriver('user-1', { licenseNumber: 'DL-123', experienceYears: 3 }))
        .rejects.toThrow(ConflictException);
    });
  });
});
