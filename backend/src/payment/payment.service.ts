import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import PDFDocument from 'pdfkit';
import { Vehicle } from '../entities/vehicle.entity';
import { Reservation, ReservationStatus, ServiceType } from '../entities/reservation.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { ClientVerification, VerificationStatus } from '../entities/client-verification.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectRepository(Vehicle)            private vehicleRepo:      Repository<Vehicle>,
    @InjectRepository(Reservation)        private reservationRepo:  Repository<Reservation>,
    @InjectRepository(Driver)             private driverRepo:       Repository<Driver>,
    @InjectRepository(User)               private userRepo:         Repository<User>,
    @InjectRepository(Payment)            private paymentRepo:      Repository<Payment>,
    @InjectRepository(ClientVerification) private verificationRepo: Repository<ClientVerification>,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not configured');
    this.stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
  }

  async createIntent(userId: string, dto: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    serviceType: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  }) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const verification = await this.verificationRepo.findOne({ where: { client: { id: userId } } });
    if (!verification || verification.status !== VerificationStatus.APPROVED)
      throw new BadRequestException('Your identity must be verified and approved by an admin before booking');

    const start = dto.startDate;
    const end   = dto.endDate;
    const startD = new Date(dto.startDate);
    const endD   = new Date(dto.endDate);
    if (endD <= startD) throw new BadRequestException('End date must be after start date');

    const conflict = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
      .andWhere('r.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
      .andWhere('r.startDate < :end',   { end })
      .andWhere('r.endDate   > :start', { start })
      .getOne();
    if (conflict) throw new BadRequestException('Vehicle is not available for selected dates');

    const days       = Math.ceil((endD.getTime() - startD.getTime()) / 86400000);
    const basePrice  = days * Number(vehicle.pricePerDay);
    const driverFee  = dto.serviceType === 'WITH_DRIVER' ? days * 50 : 0;
    const insurance  = 25;
    const serviceFee = 15;
    const totalPrice = basePrice + driverFee + insurance + serviceFee;

    let assignedDriver: Driver | null = null;
    if (dto.serviceType === 'WITH_DRIVER') {
      const drivers = await this.driverRepo.find({ where: { status: DriverStatus.APPROVED, isAvailable: true } });
      for (const driver of drivers) {
        const dc = await this.reservationRepo
          .createQueryBuilder('r')
          .where('r.driverId = :driverId', { driverId: driver.id })
          .andWhere('r.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
          .andWhere('r.startDate < :end',   { end })
          .andWhere('r.endDate   > :start', { start })
          .getOne();
        if (!dc) { assignedDriver = driver; break; }
      }
      if (!assignedDriver) throw new BadRequestException('No available drivers for selected dates');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });

    const reservation = this.reservationRepo.create({
      client:          user,
      vehicle,
      driver:          assignedDriver,
      serviceType:     dto.serviceType as ServiceType,
      startDate:       startD,
      endDate:         endD,
      pickupLocation:  dto.pickupLocation,
      dropoffLocation: dto.dropoffLocation,
      totalPrice,
      status: ReservationStatus.PENDING,
    });
    const saved = await this.reservationRepo.save(reservation);

    const intent = await this.stripe.paymentIntents.create({
      amount:      Math.round(totalPrice * 100),
      currency:    'usd',
      metadata:    { reservationId: saved.id, userId },
      description: 'Drivana reservation ' + vehicle.brand + ' ' + vehicle.model,
    });

    return { clientSecret: intent.client_secret, reservationId: saved.id, totalPrice };
  }

  async handleWebhook(sig: string, rawBody: Buffer) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata?.reservationId;
      if (reservationId) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
        if (reservation) {
          reservation.status = ReservationStatus.CONFIRMED;
          await this.reservationRepo.save(reservation);
          const payment = this.paymentRepo.create({
            reservation,
            amount:        intent.amount / 100,
            paymentMethod: intent.payment_method_types?.[0] ?? 'card',
            status:        PaymentStatus.COMPLETED,
            transactionId: intent.id,
          });
          await this.paymentRepo.save(payment);
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata?.reservationId;
      if (reservationId) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
        if (reservation) {
          reservation.status = ReservationStatus.CANCELLED;
          await this.reservationRepo.save(reservation);
          const payment = this.paymentRepo.create({
            reservation,
            amount:        intent.amount / 100,
            paymentMethod: intent.payment_method_types?.[0] ?? 'card',
            status:        PaymentStatus.FAILED,
            transactionId: intent.id,
          });
          await this.paymentRepo.save(payment);
        }
      }
    }

    return { received: true };
  }

  async confirmReservation(reservationId: string, paymentIntentId: string) {
    const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === ReservationStatus.CONFIRMED) return { message: 'Already confirmed' };

    // Verify with Stripe only if we have a real payment intent ID
    if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded')
        throw new BadRequestException('Payment has not succeeded');

      // Create payment record if not already created by webhook
      const existing = await this.paymentRepo.findOne({ where: { reservation: { id: reservationId } } });
      if (!existing) {
        const payment = this.paymentRepo.create({
          reservation,
          amount:        intent.amount / 100,
          paymentMethod: intent.payment_method_types?.[0] ?? 'card',
          status:        PaymentStatus.COMPLETED,
          transactionId: intent.id,
        });
        await this.paymentRepo.save(payment);
      }
    }

    reservation.status = ReservationStatus.CONFIRMED;
    await this.reservationRepo.save(reservation);
    return { message: 'Reservation confirmed' };
  }

  async buildContractPdf(reservationId: string, requestingUserId?: string): Promise<{ buffer: Buffer; filename: string }> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: ['client', 'vehicle', 'driver', 'driver.user'],
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (requestingUserId && reservation.client.id !== requestingUserId)
      throw new BadRequestException('Not your reservation');

    if (reservation.status === ReservationStatus.CANCELLED)
      throw new BadRequestException('Contract is not available for cancelled reservations');

    const buffer = await this.renderPdf(reservation);
    const filename = 'contract-' + reservationId.slice(-8).toUpperCase() + '.pdf';
    return { buffer, filename };
  }

  private renderPdf(reservation: Reservation): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('error', reject);
      doc.on('end',   () => resolve(Buffer.concat(chunks)));

      const orange = '#fe7f32';
      const dark   = '#1a1a1a';
      const gray   = '#555555';
      const dollar = '$';

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill(dark);
      doc.fillColor(orange).fontSize(24).font('Helvetica-Bold').text('DRIVANA', 50, 25);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text('Car Rental Contract', 50, 52);
      doc.fillColor(gray).fontSize(9)
        .text('Contract #' + reservation.id.slice(0, 8).toUpperCase(), doc.page.width - 200, 35, { width: 150, align: 'right' })
        .text('Date: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), doc.page.width - 200, 50, { width: 150, align: 'right' });

      doc.moveDown(3);

      const section = (title: string) => {
        doc.moveDown(0.5);
        doc.fillColor(orange).fontSize(11).font('Helvetica-Bold').text(title.toUpperCase());
        doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor(orange).lineWidth(0.5).stroke();
        doc.moveDown(0.5);
      };

      const row = (label: string, value: string) => {
        doc.fillColor(gray).fontSize(9).font('Helvetica').text(label, 50, doc.y, { continued: true, width: 160 });
        doc.fillColor(dark).font('Helvetica-Bold').text(value || '-');
      };

      // Client
      section('Client Information');
      const c = reservation.client;
      row('Full Name:',    c.firstName + ' ' + c.lastName);
      row('Email:',        c.email);
      row('Phone:',        c.phone || '-');

      // Vehicle
      section('Vehicle Information');
      const v = reservation.vehicle;
      row('Vehicle:',      v.brand + ' ' + v.model + ' (' + v.year + ')');
      row('Registration:', v.registration);
      row('Daily Rate:',   dollar + Number(v.pricePerDay).toFixed(2));

      // Reservation
      section('Reservation Details');
      const fmt = (d: any) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      row('Start Date:',   fmt(reservation.startDate));
      row('End Date:',     fmt(reservation.endDate));
      row('Pickup:',       reservation.pickupLocation || '-');
      row('Drop-off:',     reservation.dropoffLocation || reservation.pickupLocation || '-');
      row('Service Type:', reservation.serviceType === 'WITH_DRIVER' ? 'With Chauffeur' : 'Self-Drive');
      row('Booked On:',    new Date(reservation.createdAt).toLocaleString());

      // Driver (only if WITH_DRIVER)
      if (reservation.driver) {
        section('Assigned Driver');
        const d = reservation.driver;
        row('Driver Name:',    (d.user?.firstName || '') + ' ' + (d.user?.lastName || ''));
        row('License Number:', d.licenseNumber);
        row('Experience:',     d.experienceYears + ' years');
        row('Rating:',         Number(d.rating).toFixed(1) + ' / 5');
      }

      // Payment
      section('Payment Summary');
      const days = Math.ceil((new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / 86400000);
      const base = days * Number(v.pricePerDay);
      const dFee = reservation.serviceType === 'WITH_DRIVER' ? days * 50 : 0;
      row('Rental Duration:', days + (days > 1 ? ' days' : ' day'));
      row('Base Price:',      dollar + base.toFixed(2));
      if (dFee > 0) row('Chauffeur Fee:', dollar + dFee.toFixed(2));
      row('Insurance:',   dollar + '25.00');
      row('Service Fee:', dollar + '15.00');
      doc.moveDown(0.5);
      doc.fillColor(orange).fontSize(12).font('Helvetica-Bold')
        .text('TOTAL: ' + dollar + Number(reservation.totalPrice).toFixed(2), 50);

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#dddddd').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(8).font('Helvetica')
        .text('This document is an official rental contract between the client and Drivana. By completing the payment, the client agrees to all terms and conditions.', 50, doc.y, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    });
  }
}
