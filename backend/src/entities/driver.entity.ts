import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum DriverStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  licenseNumber: string;

  @Column({ type: 'int' })
  experienceYears: number;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING,
  })
  status: DriverStatus;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  photo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
