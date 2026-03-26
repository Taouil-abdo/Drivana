import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Reservation, ReservationStatus, ServiceType } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Vehicle)      private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)  private reservationRepo: Repository<Reservation>,
    @InjectRepository(User)         private userRepo: Repository<User>,
  ) {}

  getVehicles(brand?: string) {
    const qb = this.vehicleRepo.createQueryBuilder('v')
      .where('v.status = :status', { status: VehicleStatus.AVAILABLE })
      .orderBy('v.createdAt', 'DESC');
    if (brand) qb.andWhere('LOWER(v.brand) LIKE :brand', { brand: `%${brand.toLowerCase()}%` });
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
    if (vehicle.status !== VehicleStatus.AVAILABLE)
      throw new BadRequestException('Vehicle is not available');

    const start = new Date(dto.startDate);
    const end   = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('End date must be after start date');

    const days       = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * Number(vehicle.pricePerDay);

    const user = await this.userRepo.findOne({ where: { id: userId } });

    const reservation = this.reservationRepo.create({
      client:      user,
      vehicle,
      serviceType: dto.serviceType,
      startDate:   start,
      endDate:     end,
      totalPrice,
      status:      ReservationStatus.PENDING,
    });

    vehicle.status = VehicleStatus.RENTED;
    await this.vehicleRepo.save(vehicle);
    return this.reservationRepo.save(reservation);
  }

  getMyReservations(userId: string) {
    return this.reservationRepo.find({
      where:    { client: { id: userId } },
      relations: ['vehicle', 'driver', 'driver.user'],
      order:    { createdAt: 'DESC' },
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
    reservation.vehicle.status = VehicleStatus.AVAILABLE;
    await this.vehicleRepo.save(reservation.vehicle);
    return this.reservationRepo.save(reservation);
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
