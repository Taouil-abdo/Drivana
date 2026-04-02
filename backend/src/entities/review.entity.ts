import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';

export enum ReviewType {
  VEHICLE = 'VEHICLE',
  DRIVER = 'DRIVER',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  reviewer: User;

  @ManyToOne(() => Vehicle, { nullable: true })
  vehicle: Vehicle;

  @ManyToOne(() => Driver, { nullable: true })
  driver: Driver;

  @Column({
    type: 'enum',
    enum: ReviewType,
  })
  type: ReviewType;

  @Column({ type: 'int' })
  rating: number; // 1 to 5

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
