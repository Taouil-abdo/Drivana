import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { Driver } from '../entities/driver.entity';
import { Reservation } from '../entities/reservation.entity';
import { Review } from '../entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Reservation, Review])],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
