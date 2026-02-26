import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
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

  @Post('drivers')
  @ApiOperation({ summary: 'Create driver from existing user' })
  createDriver(@Body() body: { userId: string; licenseNumber: string; experienceYears: number }) {
    return this.adminService.createDriver(body);
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

  @Patch('drivers/:id/suspend')
  @ApiOperation({ summary: 'Suspend driver' })
  suspendDriver(@Param('id') id: string) {
    return this.adminService.suspendDriver(id);
  }

  @Delete('drivers/:id')
  @ApiOperation({ summary: 'Delete driver' })
  deleteDriver(@Param('id') id: string) {
    return this.adminService.deleteDriver(id);
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

  @Get('vehicles')
  @ApiOperation({ summary: 'Get all vehicles' })
  getAllVehicles() {
    return this.adminService.getAllVehicles();
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Create vehicle' })
  createVehicle(@Body() body: any) {
    return this.adminService.createVehicle(body);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update vehicle' })
  updateVehicle(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateVehicle(id, body);
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Delete vehicle' })
  deleteVehicle(@Param('id') id: string) {
    return this.adminService.deleteVehicle(id);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers' })
  getAllDrivers() {
    return this.adminService.getAllDrivers();
  }
}
