import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User, Role } from '../entities/user.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { ClientVerification, VerificationStatus } from '../entities/client-verification.entity';

const mockRepo = () => ({
  findOne:      jest.fn(),
  find:         jest.fn(),
  findAndCount: jest.fn(),
  count:        jest.fn(),
  create:       jest.fn(),
  save:         jest.fn(),
  delete:       jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
});

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: ReturnType<typeof mockRepo>;
  let vehicleRepo: ReturnType<typeof mockRepo>;
  let driverRepo: ReturnType<typeof mockRepo>;
  let reservationRepo: ReturnType<typeof mockRepo>;
  let verificationRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User),               useFactory: mockRepo },
        { provide: getRepositoryToken(Vehicle),            useFactory: mockRepo },
        { provide: getRepositoryToken(Driver),             useFactory: mockRepo },
        { provide: getRepositoryToken(Reservation),        useFactory: mockRepo },
        { provide: getRepositoryToken(ClientVerification), useFactory: mockRepo },
      ],
    }).compile();

    service          = module.get(AdminService);
    userRepo         = module.get(getRepositoryToken(User));
    vehicleRepo      = module.get(getRepositoryToken(Vehicle));
    driverRepo       = module.get(getRepositoryToken(Driver));
    reservationRepo  = module.get(getRepositoryToken(Reservation));
    verificationRepo = module.get(getRepositoryToken(ClientVerification));
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const user = { id: 'u1', role: Role.CLIENT };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation(u => Promise.resolve(u));

      const result = await service.updateUserRole('u1', 'ADMIN');
      expect(result.role).toBe('ADMIN');
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUserRole('bad-id', 'ADMIN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveDriver', () => {
    it('should set driver status to APPROVED and user role to DRIVER', async () => {
      const user   = { id: 'u1', role: Role.CLIENT };
      const driver = { id: 'd1', status: DriverStatus.PENDING, user };
      driverRepo.findOne.mockResolvedValue(driver);
      driverRepo.save.mockImplementation(d => Promise.resolve(d));
      userRepo.save.mockImplementation(u => Promise.resolve(u));

      const result = await service.approveDriver('d1');
      expect(result.status).toBe(DriverStatus.APPROVED);
      expect(user.role).toBe(Role.DRIVER);
    });
  });

  describe('rejectDriver', () => {
    it('should set driver status to REJECTED', async () => {
      const user   = { id: 'u1', role: Role.DRIVER };
      const driver = { id: 'd1', status: DriverStatus.APPROVED, user };
      driverRepo.findOne.mockResolvedValue(driver);
      driverRepo.save.mockImplementation(d => Promise.resolve(d));
      userRepo.save.mockImplementation(u => Promise.resolve(u));

      const result = await service.rejectDriver('d1');
      expect(result.status).toBe(DriverStatus.REJECTED);
    });
  });

  describe('createVehicle', () => {
    it('should create and return a vehicle', async () => {
      const dto = { brand: 'Toyota', model: 'Camry', year: 2022, registration: 'ABC-123', pricePerDay: 80 };
      vehicleRepo.create.mockReturnValue(dto);
      vehicleRepo.save.mockResolvedValue({ id: 'v1', ...dto });

      const result = await service.createVehicle(dto as any);
      expect(result.brand).toBe('Toyota');
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle successfully', async () => {
      vehicleRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.deleteVehicle('v1');
      expect(result.message).toContain('deleted');
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteVehicle('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveVerification', () => {
    it('should approve a verification', async () => {
      const v = { id: 'ver-1', status: VerificationStatus.PENDING, rejectionReason: null };
      verificationRepo.findOne.mockResolvedValue(v);
      verificationRepo.save.mockImplementation(x => Promise.resolve(x));

      const result = await service.approveVerification('ver-1');
      expect(result.status).toBe(VerificationStatus.APPROVED);
    });
  });

  describe('rejectVerification', () => {
    it('should reject a verification with reason', async () => {
      const v = { id: 'ver-1', status: VerificationStatus.PENDING };
      verificationRepo.findOne.mockResolvedValue(v);
      verificationRepo.save.mockImplementation(x => Promise.resolve(x));

      const result = await service.rejectVerification('ver-1', 'Blurry photo');
      expect(result.status).toBe(VerificationStatus.REJECTED);
      expect(result.rejectionReason).toBe('Blurry photo');
    });
  });
});
