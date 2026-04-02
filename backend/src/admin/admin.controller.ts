import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtGuard, RolesGuard, Roles } from '../auth';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/create-vehicle.dto';
import { CreateDriverDto } from './dto/create-driver.dto';

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

  // ── Users ──────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination & sorting' })
  @ApiQuery({ name: 'role',    required: false })
  @ApiQuery({ name: 'search',  required: false })
  @ApiQuery({ name: 'page',    required: false })
  @ApiQuery({ name: 'limit',   required: false })
  @ApiQuery({ name: 'sortBy',  required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['ASC', 'DESC'] })
  getAllUsers(
    @Query('role')    role?:    string,
    @Query('search')  search?:  string,
    @Query('page')    page?:    string,
    @Query('limit')   limit?:   string,
    @Query('sortBy')  sortBy?:  string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getAllUsers({
      role, search,
      page:    page    ? Number(page)  : 1,
      limit:   limit   ? Number(limit) : 5,
      sortBy:  sortBy  ?? 'createdAt',
      sortDir: sortDir ?? 'DESC',
    });
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

  // ── Drivers ────────────────────────────────────────────
  @Get('drivers/pending')
  @ApiOperation({ summary: 'Get pending drivers' })
  getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers with pagination & sorting' })
  @ApiQuery({ name: 'status',  required: false })
  @ApiQuery({ name: 'search',  required: false })
  @ApiQuery({ name: 'page',    required: false })
  @ApiQuery({ name: 'limit',   required: false })
  @ApiQuery({ name: 'sortBy',  required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['ASC', 'DESC'] })
  getAllDrivers(
    @Query('status')  status?:  string,
    @Query('search')  search?:  string,
    @Query('page')    page?:    string,
    @Query('limit')   limit?:   string,
    @Query('sortBy')  sortBy?:  string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getAllDrivers({
      status, search,
      page:    page    ? Number(page)  : 1,
      limit:   limit   ? Number(limit) : 20,
      sortBy:  sortBy  ?? 'createdAt',
      sortDir: sortDir ?? 'DESC',
    });
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver by ID' })
  getDriverById(@Param('id') id: string) {
    return this.adminService.getDriverById(id);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Create driver from existing user' })
  createDriver(@Body() dto: CreateDriverDto) {
    return this.adminService.createDriver(dto);
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

  // ── Vehicles ───────────────────────────────────────────
  @Get('vehicles')
  @ApiOperation({ summary: 'Get all vehicles with pagination & sorting' })
  @ApiQuery({ name: 'status',  required: false })
  @ApiQuery({ name: 'search',  required: false })
  @ApiQuery({ name: 'page',    required: false })
  @ApiQuery({ name: 'limit',   required: false })
  @ApiQuery({ name: 'sortBy',  required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['ASC', 'DESC'] })
  getAllVehicles(
    @Query('status')  status?:  string,
    @Query('search')  search?:  string,
    @Query('page')    page?:    string,
    @Query('limit')   limit?:   string,
    @Query('sortBy')  sortBy?:  string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getAllVehicles({
      status, search,
      page:    page    ? Number(page)  : 1,
      limit:   limit   ? Number(limit) : 20,
      sortBy:  sortBy  ?? 'createdAt',
      sortDir: sortDir ?? 'DESC',
    });
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Create vehicle' })
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.adminService.createVehicle(dto);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update vehicle' })
  updateVehicle(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.adminService.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Delete vehicle' })
  deleteVehicle(@Param('id') id: string) {
    return this.adminService.deleteVehicle(id);
  }

  // ── Reservations ───────────────────────────────────────
  @Get('reservations')
  @ApiOperation({ summary: 'Get all reservations with pagination & sorting' })
  @ApiQuery({ name: 'status',  required: false })
  @ApiQuery({ name: 'search',  required: false })
  @ApiQuery({ name: 'page',    required: false })
  @ApiQuery({ name: 'limit',   required: false })
  @ApiQuery({ name: 'sortBy',  required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['ASC', 'DESC'] })
  getAllReservations(
    @Query('status')  status?:  string,
    @Query('search')  search?:  string,
    @Query('page')    page?:    string,
    @Query('limit')   limit?:   string,
    @Query('sortBy')  sortBy?:  string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getAllReservations({
      status, search,
      page:    page    ? Number(page)  : 1,
      limit:   limit   ? Number(limit) : 20,
      sortBy:  sortBy  ?? 'createdAt',
      sortDir: sortDir ?? 'DESC',
    });
  }

  @Patch('reservations/:id/status')
  @ApiOperation({ summary: 'Update reservation status' })
  updateReservationStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateReservationStatus(id, status);
  }

  // ── Revenue ────────────────────────────────────────────
  @Get('revenue/monthly')
  @ApiOperation({ summary: 'Get revenue breakdown by month' })
  getRevenueByMonth() {
    return this.adminService.getRevenueByMonth();
  }

  // ── Client Verifications ───────────────────────────────
  @Get('verifications')
  @ApiOperation({ summary: 'Get client verifications' })
  getVerifications(@Query('status') status?: string) {
    return this.adminService.getVerifications(status);
  }

  @Patch('verifications/:id/approve')
  @ApiOperation({ summary: 'Approve client verification' })
  approveVerification(@Param('id') id: string) {
    return this.adminService.approveVerification(id);
  }

  @Patch('verifications/:id/reject')
  @ApiOperation({ summary: 'Reject client verification' })
  rejectVerification(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectVerification(id, reason);
  }
}
