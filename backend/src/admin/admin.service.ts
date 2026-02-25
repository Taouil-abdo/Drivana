import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from '../entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver) private driverRepository: Repository<Driver>,
    @InjectRepository(Reservation) private reservationRepository: Repository<Reservation>,
  ) {}

  // Dashboard Statistics
  async getStatistics() {
    const [totalUsers, totalVehicles, totalDrivers, totalReservations, activeReservations] = await Promise.all([
      this.userRepository.count(),
      this.vehicleRepository.count(),
      this.driverRepository.count({ where: { status: DriverStatus.APPROVED } }),
      this.reservationRepository.count(),
      this.reservationRepository.count({ where: { status: ReservationStatus.CONFIRMED } }),
    ]);

    const revenueResult = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('SUM(reservation.totalPrice)', 'total')
      .where('reservation.status = :status', { status: ReservationStatus.COMPLETED })
      .getRawOne();

    return {
      totalUsers,
      totalVehicles,
      totalDrivers,
      totalReservations,
      activeReservations,
      totalRevenue: revenueResult?.total ? Number(revenueResult.total) : 0,
    };
  }

  // User Management
  async getAllUsers(filters?: any) {
    const whereCondition = {};
    if (filters && filters.role) {
      whereCondition['role'] = filters.role;
    }
    return this.userRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt'] // Excluding password
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt'] // Excluding password
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role as Role;
    await this.userRepository.save(user);
    // Exclude password manually for return
    const { passwordHash, ...result } = user;
    return result;
  }

  async deleteUser(id: string) {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  // Driver Management
  async getPendingDrivers() {
    return this.driverRepository.find({
      where: { status: DriverStatus.PENDING },
      relations: ['user'] // Mongoose 'populate' equivalent
    });
  }

  async approveDriver(id: string) {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = DriverStatus.APPROVED;
    return this.driverRepository.save(driver);
  }

  async rejectDriver(id: string) {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = DriverStatus.REJECTED;
    return this.driverRepository.save(driver);
  }

  // Reservation Management
  async getAllReservations(filters?: any) {
    return this.reservationRepository.find({
      where: filters || {},
      relations: ['client', 'vehicle', 'driver'], // TypeORM 'populate' equivalent
      order: { createdAt: 'DESC' }
    });
  }

  async updateReservationStatus(id: string, status: string) {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    reservation.status = status as ReservationStatus;
    return this.reservationRepository.save(reservation);
  }

  // Vehicle Management
  async getAllVehicles() {
    return this.vehicleRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createVehicle(data: any) {
    const vehicle = this.vehicleRepository.create(data);
    return this.vehicleRepository.save(vehicle);
  }

  async updateVehicle(id: string, data: any) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    Object.assign(vehicle, data);
    return this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(id: string) {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Vehicle not found');
    return { message: 'Vehicle deleted successfully' };
  }

  async getAllDrivers() {
    return this.driverRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
