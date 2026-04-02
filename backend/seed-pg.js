require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database!');

  const userRepo = AppDataSource.getRepository('User');
  const vehicleRepo = AppDataSource.getRepository('Vehicle');

  // Clear existing data
  console.log('Clearing existing data...');
  await vehicleRepo.delete({});
  await userRepo.delete({});

  // Seed users
  console.log('Inserting fake users...');
  const hash = await bcrypt.hash('password123', 10);

  await userRepo.save([
    { email: 'admin@drivana.com', passwordHash: hash, firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
    { email: 'driver@drivana.com', passwordHash: hash, firstName: 'John', lastName: 'Driver', role: 'DRIVER' },
    { email: 'client@drivana.com', passwordHash: hash, firstName: 'Jane', lastName: 'Client', role: 'CLIENT' },
  ]);

  // Seed vehicles
  console.log('Inserting fake vehicles...');
  await vehicleRepo.save([
    { brand: 'Toyota', model: 'Camry', year: 2023, registration: 'XYZ-1234', pricePerDay: 45, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80', description: 'Reliable and comfortable sedan.' },
    { brand: 'BMW', model: 'M3', year: 2022, registration: 'BMW-5555', pricePerDay: 120, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80', description: 'High performance sports sedan.' },
    { brand: 'Tesla', model: 'Model 3', year: 2024, registration: 'EV-9999', pricePerDay: 90, imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80', description: 'Electric vehicle with autopilot features.' },
  ]);

  console.log('\nSeeding complete! You can login with:');
  console.log('  admin@drivana.com / password123');
  console.log('  driver@drivana.com / password123');
  console.log('  client@drivana.com / password123');

  await AppDataSource.destroy();
}

seed().catch(e => { console.error(e); process.exit(1); });
