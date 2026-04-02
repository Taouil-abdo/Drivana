import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { Vehicle } from '../entities/vehicle.entity';
import { Reservation } from '../entities/reservation.entity';
import { Driver } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { ClientVerification } from '../entities/client-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Reservation, Driver, User, ClientVerification])],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
