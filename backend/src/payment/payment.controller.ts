import { Controller, Post, Get, Body, Headers, Req, Param, Res, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for a reservation' })
  createIntent(
    @GetUser() user: any,
    @Body() dto: {
      vehicleId: string; startDate: string; endDate: string; serviceType: string;
      pickupLocation?: string; dropoffLocation?: string;
      clientAge?: number; licenseYear?: string;
      clientPhotoUrl?: string; licensePhotoUrl?: string;
    },
  ) {
    return this.paymentService.createIntent(user.id, dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  webhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentService.handleWebhook(sig, req.rawBody);
  }

  @Post('confirm-reservation')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm reservation after successful client-side payment' })
  confirmReservation(
    @Body() dto: { reservationId: string; paymentIntentId: string },
  ) {
    return this.paymentService.confirmReservation(dto.reservationId, dto.paymentIntentId);
  }

  // Client: download their own contract
  @Get('contract/:reservationId/download')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download contract PDF (client)' })
  async downloadContractClient(
    @GetUser() user: any,
    @Param('reservationId') reservationId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.paymentService.buildContractPdf(reservationId, user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  // Admin: download any contract
  @Get('contract/:reservationId/admin/download')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download contract PDF (admin)' })
  async downloadContractAdmin(
    @Param('reservationId') reservationId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.paymentService.buildContractPdf(reservationId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
