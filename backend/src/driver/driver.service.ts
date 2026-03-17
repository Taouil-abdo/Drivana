import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../entities/driver.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
    @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
  ) {}

  async getMyProfile(userId: string) {
    const driver = await this.driverRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async getMyReservations(userId: string) {
    const driver = await this.driverRepo.findOne({ where: { user: { id: userId } } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return this.reservationRepo.find({
      where: { driver: { id: driver.id } },
      relations: ['client', 'vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async completeReservation(userId: string, reservationId: string) {
    const driver = await this.driverRepo.findOne({ where: { user: { id: userId } } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: ['driver'],
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.driver?.id !== driver.id) throw new ForbiddenException('Not your reservation');
    if (reservation.status !== ReservationStatus.CONFIRMED)
      throw new ForbiddenException('Only confirmed reservations can be completed');

    reservation.status = ReservationStatus.COMPLETED;
    return this.reservationRepo.save(reservation);
  }

  async toggleAvailability(userId: string) {
    const driver = await this.driverRepo.findOne({ where: { user: { id: userId } } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    driver.isAvailable = !driver.isAvailable;
    return this.driverRepo.save(driver);
  }

  async getMyStats(userId: string) {
    const driver = await this.driverRepo.findOne({ where: { user: { id: userId } } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    const reservations = await this.reservationRepo.find({
      where: { driver: { id: driver.id } },
      select: ['id', 'status', 'totalPrice'],
    });

    const total     = reservations.length;
    const completed = reservations.filter(r => r.status === ReservationStatus.COMPLETED).length;
    const pending   = reservations.filter(r => r.status === ReservationStatus.PENDING).length;
    const confirmed = reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length;
    const earnings  = reservations
      .filter(r => r.status === ReservationStatus.COMPLETED)
      .reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0);

    return { total, completed, pending, confirmed, earnings, rating: Number(driver.rating), isAvailable: driver.isAvailable };
  }
}
