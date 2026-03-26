import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Driver } from './entities/driver.entity';
import { Reservation } from './entities/reservation.entity';
import { Review } from './entities/review.entity';
import { Payment } from './entities/payment.entity';
import { ClientVerification } from './entities/client-verification.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DriverModule } from './driver/driver.module';
import { ClientModule } from './client/client.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drivana',
      entities: [User, Vehicle, Driver, Reservation, Review, Payment, ClientVerification],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    AdminModule,
    DriverModule,
    ClientModule,
    PaymentModule,
  ],
})
export class AppModule {}
