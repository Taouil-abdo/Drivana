import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Reservation, ReservationStatus, ServiceType } from '../entities/reservation.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { ClientVerification, VerificationStatus } from '../entities/client-verification.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Vehicle)             private vehicleRepo:      Repository<Vehicle>,
    @InjectRepository(Reservation)         private reservationRepo:  Repository<Reservation>,
    @InjectRepository(Driver)              private driverRepo:       Repository<Driver>,
    @InjectRepository(User)                private userRepo:         Repository<User>,
    @InjectRepository(ClientVerification)  private verificationRepo: Repository<ClientVerification>,
  ) {}

  async getVehicles(startDate?: string, endDate?: string, brand?: string) {
    const qb = this.vehicleRepo.createQueryBuilder('v')
      .where('v.status = :status', { status: VehicleStatus.AVAILABLE })
      .orderBy('v.createdAt', 'DESC');

    if (brand) qb.andWhere('LOWER(v.brand) LIKE :brand', { brand: `%${brand.toLowerCase()}%` });

    // Exclude vehicles that have overlapping PENDING or CONFIRMED reservations
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end   = new Date(endDate);
      qb.andWhere(qb2 => {
        const sub = qb2.subQuery()
          .select('r.vehicleId')
          .from('reservations', 'r')
          .where("r.status IN ('PENDING', 'CONFIRMED')")
          .andWhere('r.startDate < :end', { end })
          .andWhere('r.endDate > :start', { start })
          .getQuery();
        return `v.id NOT IN ${sub}`;
      });
    }

    return qb.getMany();
  }

  async getVehicleById(id: string) {
    const v = await this.vehicleRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async createReservation(userId: string, dto: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    serviceType: ServiceType;
  }) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const start = dto.startDate;
    const end   = dto.endDate;
    const startD = new Date(dto.startDate);
    const endD   = new Date(dto.endDate);
    if (endD <= startD) throw new BadRequestException('End date must be after start date');

    // Check for overlapping reservations on this vehicle
    const conflict = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
      .andWhere('r.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
      .andWhere('r.startDate < :end',   { end })
      .andWhere('r.endDate   > :start', { start })
      .getOne();

    if (conflict) {
      throw new BadRequestException(
        `Vehicle is already booked from ${conflict.startDate.toISOString().slice(0,10)} to ${conflict.endDate.toISOString().slice(0,10)}`
      );
    }

    const days       = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * Number(vehicle.pricePerDay);
    const user       = await this.userRepo.findOne({ where: { id: userId } });

    // Auto-assign an available driver if WITH_DRIVER
    let assignedDriver: Driver | null = null;
    if (dto.serviceType === ServiceType.WITH_DRIVER) {
      // Find an approved, available driver who has no overlapping confirmed/pending reservations
      const drivers = await this.driverRepo.find({
        where: { status: DriverStatus.APPROVED, isAvailable: true },
      });

      for (const driver of drivers) {
        const driverConflict = await this.reservationRepo
          .createQueryBuilder('r')
          .where('r.driverId = :driverId', { driverId: driver.id })
          .andWhere('r.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
          .andWhere('r.startDate < :end',   { end })
          .andWhere('r.endDate   > :start', { start })
          .getOne();

        if (!driverConflict) {
          assignedDriver = driver;
          break;
        }
      }

      if (!assignedDriver) {
        throw new BadRequestException('No available drivers for the selected dates. Please try different dates or choose self-drive.');
      }
    }

    const reservation = this.reservationRepo.create({
      client:      user,
      vehicle,
      driver:      assignedDriver,
      serviceType: dto.serviceType,
      startDate:   startD,
      endDate:     endD,
      totalPrice,
      status:      ReservationStatus.PENDING,
    });

    return this.reservationRepo.save(reservation);
  }

  getMyReservations(userId: string) {
    return this.reservationRepo.find({
      where:     { client: { id: userId } },
      relations: ['vehicle', 'driver', 'driver.user'],
      order:     { createdAt: 'DESC' },
    });
  }

  async cancelReservation(userId: string, reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where:     { id: reservationId },
      relations: ['client', 'vehicle'],
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.client.id !== userId) throw new ForbiddenException('Not your reservation');
    if (!['PENDING', 'CONFIRMED'].includes(reservation.status))
      throw new BadRequestException('Only pending or confirmed reservations can be cancelled');

    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepo.save(reservation);
  }

  async checkAvailability(vehicleId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end   = new Date(endDate);

    const conflict = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.vehicleId = :vehicleId', { vehicleId })
      .andWhere('r.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
      .andWhere('r.startDate < :end',   { end })
      .andWhere('r.endDate   > :start', { start })
      .getOne();

    // Also check driver availability if requested
    const availableDrivers = await this.driverRepo.count({
      where: { status: DriverStatus.APPROVED, isAvailable: true },
    });

    return {
      available: !conflict,
      driversAvailable: availableDrivers,
      conflict: conflict ? {
        from: conflict.startDate.toISOString().slice(0, 10),
        to:   conflict.endDate.toISOString().slice(0, 10),
      } : null,
    };
  }

  async submitVerification(userId: string, dto: { age: number; licenseYear: string; licensePhotoUrl: string }) {
    const currentYear = new Date().getFullYear();

    if (dto.age < 20) throw new BadRequestException('You must be at least 20 years old to rent a vehicle');

    const licenseAge = currentYear - parseInt(dto.licenseYear);
    if (licenseAge < 2) throw new BadRequestException('Your license must be at least 2 years old');

    const existing = await this.verificationRepo.findOne({ where: { client: { id: userId } } });
    if (existing) {
      if (existing.status === VerificationStatus.APPROVED)
        throw new BadRequestException('Your account is already verified');
      if (existing.status === VerificationStatus.PENDING)
        throw new BadRequestException('Your verification is already pending admin review');
      // REJECTED — allow resubmission
      existing.age            = dto.age;
      existing.licenseYear    = dto.licenseYear;
      existing.licensePhotoUrl = dto.licensePhotoUrl;
      existing.status         = VerificationStatus.PENDING;
      existing.rejectionReason = null;
      return this.verificationRepo.save(existing);
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const verification = this.verificationRepo.create({
      client:          user,
      age:             dto.age,
      licenseYear:     dto.licenseYear,
      licensePhotoUrl: dto.licensePhotoUrl,
    });
    return this.verificationRepo.save(verification);
  }

  async getMyVerification(userId: string) {
    const v = await this.verificationRepo.findOne({ where: { client: { id: userId } } });
    return v ?? { status: 'NOT_SUBMITTED' };
  }

  async deleteReservation(userId: string, reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where:     { id: reservationId },
      relations: ['client'],
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.client.id !== userId) throw new ForbiddenException('Not your reservation');
    if (reservation.status !== ReservationStatus.CANCELLED)
      throw new BadRequestException('Only cancelled reservations can be deleted');
    await this.reservationRepo.delete(reservationId);
    return { message: 'Reservation deleted' };
  }

  async getMyStats(userId: string) {
    const reservations = await this.reservationRepo.find({
      where:  { client: { id: userId } },
      select: ['id', 'status', 'totalPrice'],
    });
    const total     = reservations.length;
    const active    = reservations.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status)).length;
    const completed = reservations.filter(r => r.status === ReservationStatus.COMPLETED).length;
    const spent     = reservations
      .filter(r => r.status === ReservationStatus.COMPLETED)
      .reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0);
    return { total, active, completed, spent };
  }
}
