import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ServiceType {
  CAR_ONLY   = 'CAR_ONLY',
  WITH_DRIVER = 'WITH_DRIVER',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  client: User;

  @ManyToOne(() => Vehicle)
  vehicle: Vehicle;

  @ManyToOne(() => Driver, { nullable: true })
  driver: Driver;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.CAR_ONLY,
  })
  serviceType: ServiceType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ nullable: true })
  pickupLocation: string;

  @Column({ nullable: true })
  dropoffLocation: string;

  // Client info collected at booking time
  @Column({ type: 'int', nullable: true })
  clientAge: number;

  @Column({ nullable: true })
  licenseYear: string;

  @Column({ nullable: true })
  clientPhotoUrl: string;

  @Column({ nullable: true })
  licensePhotoUrl: string;

  // Generated contract PDF URL
  @Column({ nullable: true })
  contractPdfUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
