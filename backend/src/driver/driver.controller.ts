import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DriverService } from './driver.service';
import { JwtGuard, RolesGuard, Roles } from '../auth';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Driver')
@Controller('driver')
@UseGuards(JwtGuard, RolesGuard)
@Roles('DRIVER')
@ApiBearerAuth()
export class DriverController {
  constructor(private driverService: DriverService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own driver profile' })
  getMyProfile(@GetUser() user: any) {
    return this.driverService.getMyProfile(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get driver stats' })
  getMyStats(@GetUser() user: any) {
    return this.driverService.getMyStats(user.id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Get assigned reservations' })
  getMyReservations(@GetUser() user: any) {
    return this.driverService.getMyReservations(user.id);
  }

  @Patch('reservations/:id/complete')
  @ApiOperation({ summary: 'Mark reservation as completed' })
  completeReservation(@GetUser() user: any, @Param('id') id: string) {
    return this.driverService.completeReservation(user.id, id);
  }

  @Patch('reservations/:id/accept')
  @ApiOperation({ summary: 'Accept a pending reservation' })
  acceptReservation(@GetUser() user: any, @Param('id') id: string) {
    return this.driverService.acceptReservation(user.id, id);
  }

  @Patch('reservations/:id/reject')
  @ApiOperation({ summary: 'Reject a pending reservation' })
  rejectReservation(@GetUser() user: any, @Param('id') id: string) {
    return this.driverService.rejectReservation(user.id, id);
  }

  @Post('drivers/:id/rate')
  @ApiOperation({ summary: 'Rate a driver after a completed trip' })
  @ApiBody({ schema: { properties: { rating: { type: 'number' }, comment: { type: 'string' } } } })
  rateDriver(@GetUser() user: any, @Param('id') id: string, @Body() body: { rating: number; comment?: string }) {
    return this.driverService.rateDriver(user.id, id, body.rating, body.comment);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle availability' })
  toggleAvailability(@GetUser() user: any) {
    return this.driverService.toggleAvailability(user.id);
  }
}
