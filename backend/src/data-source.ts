import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Driver } from './entities/driver.entity';
import { Reservation } from './entities/reservation.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:drivana_pass@localhost:5432/drivana',
  entities: [User, Vehicle, Driver, Reservation],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
