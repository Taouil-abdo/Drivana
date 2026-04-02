import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DriverService } from './driver.service';
import { Driver } from '../entities/driver.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Review } from '../entities/review.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find:    jest.fn(),
  count:   jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
});

describe('DriverService', () => {
  let service: DriverService;
  let driverRepo: ReturnType<typeof mockRepo>;
  let reservationRepo: ReturnType<typeof mockRepo>;
  let reviewRepo: ReturnType<typeof mockRepo>;

  const fakeDriver = { id: 'driver-1', isAvailable: true, rating: 4.5 };
  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        { provide: getRepositoryToken(Driver),      useFactory: mockRepo },
        { provide: getRepositoryToken(Reservation), useFactory: mockRepo },
        { provide: getRepositoryToken(Review),      useFactory: mockRepo },
      ],
    }).compile();

    service        = module.get(DriverService);
    driverRepo     = module.get(getRepositoryToken(Driver));
    reservationRepo = module.get(getRepositoryToken(Reservation));
    reviewRepo     = module.get(getRepositoryToken(Review));
  });

  describe('getMyProfile', () => {
    it('should return driver profile', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      const result = await service.getMyProfile(userId);
      expect(result).toEqual(fakeDriver);
    });

    it('should throw NotFoundException if no driver profile', async () => {
      driverRepo.findOne.mockResolvedValue(null);
      await expect(service.getMyProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle isAvailable from true to false', async () => {
      driverRepo.findOne.mockResolvedValue({ ...fakeDriver, isAvailable: true });
      driverRepo.save.mockImplementation(d => Promise.resolve(d));

      const result = await service.toggleAvailability(userId);
      expect(result.isAvailable).toBe(false);
    });

    it('should toggle isAvailable from false to true', async () => {
      driverRepo.findOne.mockResolvedValue({ ...fakeDriver, isAvailable: false });
      driverRepo.save.mockImplementation(d => Promise.resolve(d));

      const result = await service.toggleAvailability(userId);
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('completeReservation', () => {
    it('should mark reservation as COMPLETED', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      const reservation = { id: 'res-1', status: ReservationStatus.CONFIRMED, driver: fakeDriver };
      reservationRepo.findOne.mockResolvedValue(reservation);
      reservationRepo.save.mockImplementation(r => Promise.resolve(r));

      const result = await service.completeReservation(userId, 'res-1');
      expect(result.status).toBe(ReservationStatus.COMPLETED);
    });

    it('should throw ForbiddenException if reservation belongs to another driver', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      reservationRepo.findOne.mockResolvedValue({ id: 'res-1', status: ReservationStatus.CONFIRMED, driver: { id: 'other-driver' } });

      await expect(service.completeReservation(userId, 'res-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if reservation is not CONFIRMED', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      reservationRepo.findOne.mockResolvedValue({ id: 'res-1', status: ReservationStatus.PENDING, driver: fakeDriver });

      await expect(service.completeReservation(userId, 'res-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptReservation', () => {
    it('should accept a PENDING reservation', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      const reservation = { id: 'res-1', status: ReservationStatus.PENDING, driver: fakeDriver };
      reservationRepo.findOne.mockResolvedValue(reservation);
      reservationRepo.save.mockImplementation(r => Promise.resolve(r));

      const result = await service.acceptReservation(userId, 'res-1');
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should throw BadRequestException if reservation is not PENDING', async () => {
      driverRepo.findOne.mockResolvedValue(fakeDriver);
      reservationRepo.findOne.mockResolvedValue({ id: 'res-1', status: ReservationStatus.CONFIRMED, driver: fakeDriver });

      await expect(service.acceptReservation(userId, 'res-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rateDriver', () => {
    it('should save review and update driver rating', async () => {
      driverRepo.findOne.mockResolvedValue({ ...fakeDriver, rating: 0 });
      reviewRepo.create.mockReturnValue({ rating: 5 });
      reviewRepo.save.mockResolvedValue({});
      reviewRepo.find.mockResolvedValue([{ rating: 4 }, { rating: 5 }]);
      driverRepo.save.mockImplementation(d => Promise.resolve(d));

      const result = await service.rateDriver('reviewer-1', 'driver-1', 5);
      expect(result.message).toContain('Rating');
      expect(result.newRating).toBe(4.5);
    });

    it('should throw BadRequestException for rating out of range', async () => {
      await expect(service.rateDriver('reviewer-1', 'driver-1', 6)).rejects.toThrow(BadRequestException);
      await expect(service.rateDriver('reviewer-1', 'driver-1', 0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyStats', () => {
    it('should return correct stats', async () => {
      driverRepo.findOne.mockResolvedValue({ ...fakeDriver, rating: 4.5, isAvailable: true });
      reservationRepo.find.mockResolvedValue([
        { id: '1', status: ReservationStatus.COMPLETED, totalPrice: 100 },
        { id: '2', status: ReservationStatus.COMPLETED, totalPrice: 200 },
        { id: '3', status: ReservationStatus.PENDING,   totalPrice: 50  },
      ]);

      const stats = await service.getMyStats(userId);
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.earnings).toBe(300);
    });
  });
});
