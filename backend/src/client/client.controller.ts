import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ServiceType } from '../entities/reservation.entity';

@ApiTags('Client')
@Controller('client')
export class ClientController {
  constructor(private clientService: ClientService) {}

  // Public — no auth needed
  @Get('vehicles')
  @ApiOperation({ summary: 'Get available vehicles' })
  getVehicles(
    @Query('brand')      brand?:      string,
    @Query('startDate')  startDate?:  string,
    @Query('endDate')    endDate?:    string,
  ) {
    return this.clientService.getVehicles(startDate, endDate, brand);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  getVehicleById(@Param('id') id: string) {
    return this.clientService.getVehicleById(id);
  }

  @Get('vehicles/:id/availability')
  @ApiOperation({ summary: 'Check vehicle availability for date range' })
  checkAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate')   endDate:   string,
  ) {
    return this.clientService.checkAvailability(id, startDate, endDate);
  }

  // Protected — requires login
  @Post('reservations')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a reservation' })
  createReservation(
    @GetUser() user: any,
    @Body() dto: { vehicleId: string; startDate: string; endDate: string; serviceType: ServiceType },
  ) {
    return this.clientService.createReservation(user.id, dto);
  }

  @Get('reservations')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reservations' })
  getMyReservations(@GetUser() user: any) {
    return this.clientService.getMyReservations(user.id);
  }

  @Patch('reservations/:id/cancel')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a reservation' })
  cancelReservation(@GetUser() user: any, @Param('id') id: string) {
    return this.clientService.cancelReservation(user.id, id);
  }

  @Delete('reservations/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a cancelled reservation' })
  deleteReservation(@GetUser() user: any, @Param('id') id: string) {
    return this.clientService.deleteReservation(user.id, id);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my stats' })
  getMyStats(@GetUser() user: any) {
    return this.clientService.getMyStats(user.id);
  }

  @Post('verification')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit identity verification' })
  submitVerification(
    @GetUser() user: any,
    @Body() dto: { age: number; licenseYear: string; licensePhotoUrl: string },
  ) {
    return this.clientService.submitVerification(user.id, dto);
  }

  @Get('verification')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my verification status' })
  getMyVerification(@GetUser() user: any) {
    return this.clientService.getMyVerification(user.id);
  }
}
