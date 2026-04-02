import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, Role } from '../entities/user.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { ClientVerification, VerificationStatus } from '../entities/client-verification.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/create-vehicle.dto';
import { CreateDriverDto } from './dto/create-driver.dto';

interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
  role?: string;
  status?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)                private userRepo:         Repository<User>,
    @InjectRepository(Vehicle)             private vehicleRepo:      Repository<Vehicle>,
    @InjectRepository(Driver)              private driverRepo:       Repository<Driver>,
    @InjectRepository(Reservation)         private reservationRepo:  Repository<Reservation>,
    @InjectRepository(ClientVerification)  private verificationRepo: Repository<ClientVerification>,
  ) {}

  // ── Statistics ─────────────────────────────────────────
  async getStatistics() {
    const [totalUsers, totalVehicles, totalDrivers, totalReservations, activeReservations] = await Promise.all([
      this.userRepo.count(),
      this.vehicleRepo.count(),
      this.driverRepo.count({ where: { status: DriverStatus.APPROVED } }),
      this.reservationRepo.count(),
      this.reservationRepo.count({ where: { status: ReservationStatus.CONFIRMED } }),
    ]);
    const rev = await this.reservationRepo
      .createQueryBuilder('r')
      .select('SUM(r.totalPrice)', 'total')
      .where('r.status = :s', { s: ReservationStatus.COMPLETED })
      .getRawOne();
    return { totalUsers, totalVehicles, totalDrivers, totalReservations, activeReservations, totalRevenue: Number(rev?.total ?? 0) };
  }

  // ── Users ──────────────────────────────────────────────
  async getAllUsers(q: PaginationQuery = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC', search, role } = q;
    const where: any[] = [];

    const base = role ? { role: role as Role } : {};
    if (search) {
      where.push(
        { ...base, firstName: ILike(`%${search}%`) },
        { ...base, lastName:  ILike(`%${search}%`) },
        { ...base, email:     ILike(`%${search}%`) },
      );
    } else {
      where.push(base);
    }

    const validSort = ['firstName', 'lastName', 'email', 'role', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';
    const [data, total] = await this.userRepo.findAndCount({
      where,
      order: { [validSort]: sortDir },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'createdAt'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role as Role;
    await this.userRepo.save(user);
    const { passwordHash, ...result } = user;
    return result;
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Remove related records to avoid FK constraint violations
    await this.verificationRepo.delete({ client: { id } });
    await this.reservationRepo.delete({ client: { id } });

    const driver = await this.driverRepo.findOne({ where: { user: { id } } });
    if (driver) await this.driverRepo.delete(driver.id);

    await this.userRepo.delete(id);
    return { message: 'User deleted successfully' };
  }

  // ── Drivers ────────────────────────────────────────────
  async getPendingDrivers() {
    return this.driverRepo.find({ where: { status: DriverStatus.PENDING }, relations: ['user'] });
  }

  async getAllDrivers(q: PaginationQuery = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC', search, status } = q;
    const validSort = ['createdAt', 'rating', 'experienceYears', 'status'].includes(sortBy) ? sortBy : 'createdAt';

    const qb = this.driverRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'user')
      .orderBy(`d.${validSort}`, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('d.status = :status', { status });
    if (search) qb.andWhere(
      '(user.firstName ILIKE :s OR user.lastName ILIKE :s OR user.email ILIKE :s OR d.licenseNumber ILIKE :s)',
      { s: `%${search}%` }
    );

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDriverById(id: string) {
    const driver = await this.driverRepo.findOne({ where: { id }, relations: ['user'] });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async approveDriver(id: string) {
    const driver = await this.driverRepo.findOne({ where: { id }, relations: ['user'] });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = DriverStatus.APPROVED;
    const saved = await this.driverRepo.save(driver);
    if (driver.user) { driver.user.role = Role.DRIVER; await this.userRepo.save(driver.user); }
    return saved;
  }

  async rejectDriver(id: string) {
    const driver = await this.driverRepo.findOne({ where: { id }, relations: ['user'] });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = DriverStatus.REJECTED;
    const saved = await this.driverRepo.save(driver);
    if (driver.user) { driver.user.role = Role.CLIENT; await this.userRepo.save(driver.user); }
    return saved;
  }

  async suspendDriver(id: string) {
    const driver = await this.driverRepo.findOne({ where: { id }, relations: ['user'] });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = DriverStatus.SUSPENDED;
    return this.driverRepo.save(driver);
  }

  async createDriver(dto: CreateDriverDto) {
    let user: User;

    if (dto.userId) {
      // Link to existing user
      user = await this.userRepo.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
    } else {
      // Create new user
      if (!dto.email || !dto.firstName || !dto.lastName || !dto.password)
        throw new NotFoundException('email, firstName, lastName and password are required when not linking an existing user');
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new NotFoundException('A user with this email already exists');
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(dto.password, 10);
      user = this.userRepo.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash: hash,
        role: Role.DRIVER,
      });
      await this.userRepo.save(user);
    }

    const driver = this.driverRepo.create({
      user,
      licenseNumber:        dto.licenseNumber,
      experienceYears:      dto.experienceYears,
      licenseDocumentUrl:   dto.licenseDocumentUrl,
      insuranceDocumentUrl: dto.insuranceDocumentUrl,
      photo:                dto.photo,
      status:               DriverStatus.APPROVED,
    });
    const saved = await this.driverRepo.save(driver);
    user.role = Role.DRIVER;
    await this.userRepo.save(user);
    return saved;
  }

  async deleteDriver(id: string) {
    const driver = await this.driverRepo.findOne({ where: { id }, relations: ['user'] });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.user) { driver.user.role = Role.CLIENT; await this.userRepo.save(driver.user); }
    await this.driverRepo.delete(id);
    return { message: 'Driver removed successfully' };
  }

  // ── Vehicles ───────────────────────────────────────────
  async getAllVehicles(q: PaginationQuery = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC', search, status } = q;
    const validSort = ['brand', 'model', 'year', 'pricePerDay', 'status', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';
    const where: any[] = [];

    const base = status ? { status: status as VehicleStatus } : {};
    if (search) {
      where.push(
        { ...base, brand:        ILike(`%${search}%`) },
        { ...base, model:        ILike(`%${search}%`) },
        { ...base, registration: ILike(`%${search}%`) },
      );
    } else {
      where.push(base);
    }

    const [data, total] = await this.vehicleRepo.findAndCount({
      where,
      order: { [validSort]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createVehicle(dto: CreateVehicleDto) {
    const vehicle = this.vehicleRepo.create(dto);
    return this.vehicleRepo.save(vehicle);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  async deleteVehicle(id: string) {
    const result = await this.vehicleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Vehicle not found');
    return { message: 'Vehicle deleted successfully' };
  }

  // ── Reservations ───────────────────────────────────────
  async getAllReservations(q: PaginationQuery = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC', search, status } = q;
    const validSort = ['createdAt', 'totalPrice', 'startDate', 'endDate', 'status'].includes(sortBy) ? sortBy : 'createdAt';

    const qb = this.reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.client',  'client')
      .leftJoinAndSelect('r.vehicle', 'vehicle')
      .leftJoinAndSelect('r.driver',  'driver')
      .leftJoinAndSelect('driver.user', 'driverUser')
      .orderBy(`r.${validSort}`, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });
    if (search) qb.andWhere(
      '(client.firstName ILIKE :s OR client.lastName ILIKE :s OR vehicle.brand ILIKE :s OR vehicle.model ILIKE :s)',
      { s: `%${search}%` }
    );

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateReservationStatus(id: string, status: string) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    reservation.status = status as ReservationStatus;
    return this.reservationRepo.save(reservation);
  }

  // ── Revenue ────────────────────────────────────────────
  async getRevenueByMonth() {
    const rows = await this.reservationRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(r.totalPrice)', 'revenue')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.status = :s', { s: ReservationStatus.COMPLETED })
      .groupBy("TO_CHAR(r.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(r.createdAt, 'YYYY-MM')", 'ASC')
      .limit(12)
      .getRawMany();
    return rows.map(r => ({ month: r.month, revenue: Number(r.revenue ?? 0), count: Number(r.count ?? 0) }));
  }

  // ── Client Verifications ───────────────────────────────
  async getVerifications(status?: string) {
    const where: any = {};
    if (status) where.status = status as VerificationStatus;
    return this.verificationRepo.find({
      where,
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveVerification(id: string) {
    const v = await this.verificationRepo.findOne({ where: { id }, relations: ['client'] });
    if (!v) throw new NotFoundException('Verification not found');
    v.status = VerificationStatus.APPROVED;
    v.rejectionReason = null;
    return this.verificationRepo.save(v);
  }

  async rejectVerification(id: string, reason: string) {
    const v = await this.verificationRepo.findOne({ where: { id }, relations: ['client'] });
    if (!v) throw new NotFoundException('Verification not found');
    v.status = VerificationStatus.REJECTED;
    v.rejectionReason = reason ?? 'Does not meet requirements';
    return this.verificationRepo.save(v);
  }
}
