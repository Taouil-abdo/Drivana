import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const vehicleRepository = app.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));

  console.log('Clearing existing data...');
  await vehicleRepository.delete({});
  await userRepository.delete({});

  console.log('Inserting fake users...');
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('password123', salt);

  const users = userRepository.create([
    { email: 'admin@drivana.com', passwordHash: password, firstName: 'Admin', lastName: 'User', role: Role.ADMIN },
    { email: 'driver@drivana.com', passwordHash: password, firstName: 'John', lastName: 'Driver', role: Role.DRIVER },
    { email: 'client@drivana.com', passwordHash: password, firstName: 'Jane', lastName: 'Client', role: Role.CLIENT }
  ]);
  await userRepository.save(users);

  console.log('Inserting fake vehicles...');
  const vehicles = vehicleRepository.create([
    { brand: 'Toyota', model: 'Camry', year: 2023, registration: 'XYZ-1234', pricePerDay: 45, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80', description: 'Reliable and comfortable sedan.' },
    { brand: 'BMW', model: 'M3', year: 2022, registration: 'BMW-5555', pricePerDay: 120, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80', description: 'High performance sports sedan.' },
    { brand: 'Tesla', model: 'Model 3', year: 2024, registration: 'EV-9999', pricePerDay: 90, imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80', description: 'Electric vehicle with autopilot features.' }
  ]);
  
  await vehicleRepository.save(vehicles);

  console.log('Seeding complete! You can login with:');
  console.log('admin@drivana.com / password123');
  console.log('driver@drivana.com / password123');
  console.log('client@drivana.com / password123');

  await app.close();
}
bootstrap();
