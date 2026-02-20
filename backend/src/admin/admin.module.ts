import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Driver } from '../entities/driver.entity';
import { Reservation } from '../entities/reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      Driver,
      Reservation,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
