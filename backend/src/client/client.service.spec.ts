import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ClientService } from './client.service';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Reservation, ReservationStatus, ServiceType } from '../entities/reservation.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { ClientVerification, VerificationStatus } from '../entities/client-verification.entity';

const mockRepo = () => ({
  findOne:  jest.fn(),
  find:     jest.fn(),
  count:    jest.fn(),
  create:   jest.fn(),
  save:     jest.fn(),
  delete:   jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where:         jest.fn().mockReturnThis(),
    andWhere:      jest.fn().mockReturnThis(),
    orderBy:       jest.fn().mockReturnThis(),
    getOne:        jest.fn().mockResolvedValue(null),
    getMany:       jest.fn().mockResolvedValue([]),
  })),
});

describe('ClientService', () => {
  let service: ClientService;
  let vehicleRepo: ReturnType<typeof mockRepo>;
  let reservationRepo: ReturnType<typeof mockRepo>;
  let driverRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let verificationRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: getRepositoryToken(Vehicle),            useFactory: mockRepo },
        { provide: getRepositoryToken(Reservation),        useFactory: mockRepo },
        { provide: getRepositoryToken(Driver),             useFactory: mockRepo },
        { provide: getRepositoryToken(User),               useFactory: mockRepo },
        { provide: getRepositoryToken(ClientVerification), useFactory: mockRepo },
      ],
    }).compile();

    service          = module.get(ClientService);
    vehicleRepo      = module.get(getRepositoryToken(Vehicle));
    reservationRepo  = module.get(getRepositoryToken(Reservation));
    driverRepo       = module.get(getRepositoryToken(Driver));
    userRepo         = module.get(getRepositoryToken(User));
    verificationRepo = module.get(getRepositoryToken(ClientVerification));
  });

  describe('getVehicleById', () => {
    it('should return vehicle', async () => {
      const v = { id: 'v1', brand: 'BMW', status: VehicleStatus.AVAILABLE };
      vehicleRepo.findOne.mockResolvedValue(v);
      const result = await service.getVehicleById('v1');
      expect(result.brand).toBe('BMW');
    });

    it('should throw NotFoundException if not found', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);
      await expect(service.getVehicleById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a PENDING reservation', async () => {
      const reservation = { id: 'r1', status: ReservationStatus.PENDING, client: { id: 'u1' } };
      reservationRepo.findOne.mockResolvedValue(reservation);
      reservationRepo.save.mockImplementation(r => Promise.resolve(r));

      const result = await service.cancelReservation('u1', 'r1');
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should throw ForbiddenException if not the client', async () => {
      reservationRepo.findOne.mockResolvedValue({ id: 'r1', status: ReservationStatus.PENDING, client: { id: 'other' } });
      await expect(service.cancelReservation('u1', 'r1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already cancelled', async () => {
      reservationRepo.findOne.mockResolvedValue({ id: 'r1', status: ReservationStatus.CANCELLED, client: { id: 'u1' } });
      await expect(service.cancelReservation('u1', 'r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteReservation', () => {
    it('should delete a CANCELLED reservation', async () => {
      reservationRepo.findOne.mockResolvedValue({ id: 'r1', status: ReservationStatus.CANCELLED, client: { id: 'u1' } });
      reservationRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteReservation('u1', 'r1');
      expect(result.message).toContain('deleted');
    });

    it('should throw BadRequestException if reservation is not cancelled', async () => {
      reservationRepo.findOne.mockResolvedValue({ id: 'r1', status: ReservationStatus.CONFIRMED, client: { id: 'u1' } });
      await expect(service.deleteReservation('u1', 'r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitVerification', () => {
    it('should create a new verification', async () => {
      verificationRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      const v = { id: 'ver-1', status: VerificationStatus.PENDING };
      verificationRepo.create.mockReturnValue(v);
      verificationRepo.save.mockResolvedValue(v);

      const result = await service.submitVerification('u1', {
        age: 25,
        licenseYear: String(new Date().getFullYear() - 3),
        licensePhotoUrl: 'https://example.com/photo.jpg',
      });
      expect(result.status).toBe(VerificationStatus.PENDING);
    });

    it('should throw BadRequestException if age < 20', async () => {
      await expect(service.submitVerification('u1', {
        age: 18,
        licenseYear: '2020',
        licensePhotoUrl: 'https://example.com/photo.jpg',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if license < 2 years old', async () => {
      const thisYear = new Date().getFullYear();
      await expect(service.submitVerification('u1', {
        age: 25,
        licenseYear: String(thisYear - 1),
        licensePhotoUrl: 'https://example.com/photo.jpg',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyStats', () => {
    it('should return correct stats', async () => {
      reservationRepo.find.mockResolvedValue([
        { id: '1', status: ReservationStatus.COMPLETED, totalPrice: 150 },
        { id: '2', status: ReservationStatus.CONFIRMED, totalPrice: 100 },
        { id: '3', status: ReservationStatus.PENDING,   totalPrice: 80  },
      ]);

      const stats = await service.getMyStats('u1');
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.spent).toBe(150);
    });
  });
});
