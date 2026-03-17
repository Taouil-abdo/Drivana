import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle availability' })
  toggleAvailability(@GetUser() user: any) {
    return this.driverService.toggleAvailability(user.id);
  }
}
