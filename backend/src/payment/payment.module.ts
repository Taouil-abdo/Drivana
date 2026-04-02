import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Vehicle } from '../entities/vehicle.entity';
import { Reservation } from '../entities/reservation.entity';
import { Driver } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';
import { ClientVerification } from '../entities/client-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Reservation, Driver, User, Payment, ClientVerification])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
