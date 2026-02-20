import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtGuard, RolesGuard, Roles } from '../auth';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('statistics')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStatistics() {
    return this.adminService.getStatistics();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers(@Query('role') role?: string) {
    return this.adminService.getAllUsers(role ? { role } : {});
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('drivers/pending')
  @ApiOperation({ summary: 'Get pending drivers' })
  getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Patch('drivers/:id/approve')
  @ApiOperation({ summary: 'Approve driver' })
  approveDriver(@Param('id') id: string) {
    return this.adminService.approveDriver(id);
  }

  @Patch('drivers/:id/reject')
  @ApiOperation({ summary: 'Reject driver' })
  rejectDriver(@Param('id') id: string) {
    return this.adminService.rejectDriver(id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Get all reservations' })
  getAllReservations(@Query('status') status?: string) {
    return this.adminService.getAllReservations(status ? { status } : {});
  }

  @Patch('reservations/:id/status')
  @ApiOperation({ summary: 'Update reservation status' })
  updateReservationStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateReservationStatus(id, status);
  }
}
