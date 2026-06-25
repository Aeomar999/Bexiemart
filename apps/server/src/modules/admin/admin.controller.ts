import { Controller, Get, Patch, Put, Param, Query, Body, UseGuards, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SuperAdminGuard } from "../../guards/super-admin.guard";
import { AdminService } from "./admin.service";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { BanUserDto } from "./dto/ban-user.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { ResolveDisputeDto } from "./dto/resolve-dispute.dto";
import { UpdateDispatcherStatusDto } from "./dto/update-dispatcher-status.dto";
import { CreateFlashSaleDto } from "./dto/create-flash-sale.dto";
import { CreateCouponDto } from "./dto/create-coupon.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(AuthGuard, AdminGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Users ─────────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: "List all users" })
  @Get("users")
  listUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.listUsers(Number(page) || 1, Number(limit) || 20, search);
  }

  @ApiOperation({ summary: "Get user by ID" })
  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.adminService.getUser(id);
  }

  @ApiOperation({ summary: "Update user role" })
  @ApiBody({ type: UpdateRoleDto })
  @Patch("users/:id/role")
  updateUserRole(@Param("id") id: string, @Body() body: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @ApiOperation({ summary: "Ban/deactivate a user and revoke their sessions" })
  @ApiBody({ type: BanUserDto })
  @Patch("users/:id/ban")
  banUser(@Param("id") id: string, @Body() body: BanUserDto) {
    return this.adminService.banUser(id, body.reason);
  }

  @ApiOperation({ summary: "Unban/reactivate a user" })
  @Patch("users/:id/unban")
  unbanUser(@Param("id") id: string) {
    return this.adminService.unbanUser(id);
  }

  // ─── Admin Team (super-admin only) ───────────────────────────────────────────────

  @ApiOperation({ summary: "List admin accounts (super admin only)" })
  @UseGuards(SuperAdminGuard)
  @Get("admins")
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @ApiOperation({ summary: "Create a new admin account (super admin only)" })
  @ApiBody({ type: CreateAdminDto })
  @UseGuards(SuperAdminGuard)
  @Post("admins")
  createAdmin(@Body() body: CreateAdminDto) {
    return this.adminService.createAdmin(body);
  }

  // ─── Vendors ───────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: "List all vendors" })
  @Get("vendors")
  listVendors(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.listVendors(Number(page) || 1, Number(limit) || 20, search);
  }

  @ApiOperation({ summary: "Get vendor by ID" })
  @Get("vendors/:id")
  getVendor(@Param("id") id: string) {
    return this.adminService.getVendor(id);
  }

  @ApiOperation({ summary: "Approve a vendor" })
  @Patch("vendors/:id/approve")
  approveVendor(@Param("id") id: string) {
    return this.adminService.approveVendor(id);
  }

  @ApiOperation({ summary: "Suspend a vendor" })
  @Patch("vendors/:id/suspend")
  suspendVendor(@Param("id") id: string) {
    return this.adminService.suspendVendor(id);
  }

  // ─── Platform Config ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: "Get platform config" })
  @Get("config")
  getConfig() {
    return this.adminService.getConfig();
  }

  @ApiOperation({ summary: "Update platform config" })
  @ApiBody({ type: UpdateConfigDto })
  @Put("config")
  updateConfig(@Body() body: UpdateConfigDto) {
    return this.adminService.updateConfig(body);
  }

  // ─── Orders Oversight ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: "List orders" })
  @Get("orders")
  listOrders(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.listOrders(status, Number(page) || 1, Number(limit) || 20, search);
  }

  @ApiOperation({ summary: "Get order by ID" })
  @Get("orders/:id")
  getOrder(@Param("id") id: string) {
    return this.adminService.getOrder(id);
  }

  @ApiOperation({ summary: "Update order status" })
  @ApiBody({ type: UpdateOrderStatusDto })
  @Patch("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body() body: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, body.status);
  }

  // ─── Disputes ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: "List disputed escrows" })
  @Get("disputes")
  listDisputes(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.listDisputes(Number(page) || 1, Number(limit) || 20, search);
  }

  @ApiOperation({ summary: "Get dispute by ID" })
  @Get("disputes/:id")
  getDispute(@Param("id") id: string) {
    return this.adminService.getDispute(id);
  }

  @ApiOperation({ summary: "Resolve a dispute" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["REFUND", "RELEASE"] },
        reason: { type: "string" },
      },
    },
  })
  @Post("disputes/:id/resolve")
  resolveDispute(@Param("id") id: string, @Body() body: ResolveDisputeDto) {
    return this.adminService.resolveDispute(id, body.action, body.reason);
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: "Get dashboard stats" })
  @Get("dashboard")
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── Reports ───────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: "Get revenue report" })
  @Get("reports/revenue")
  getRevenueReport(@Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.adminService.getRevenueReport(startDate, endDate);
  }

  @ApiOperation({ summary: "Get users report" })
  @Get("reports/users")
  getUsersReport(@Query("startDate") startDate?: string, @Query("endDate") endDate?: string) {
    return this.adminService.getUsersReport(startDate, endDate);
  }

  @ApiOperation({ summary: "Get orders report" })
  @Get("reports/orders")
  async getOrdersReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.adminService.getOrdersReport(startDate, endDate);
  }

  // ─── Dispatchers & Deliveries ──────────────────────────────────────────────────

  @Get("dispatchers")
  async listDispatchers(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("search") search?: string
  ) {
    return this.adminService.listDispatchers(Number(page), Number(limit), search);
  }

  @Get("dispatchers/:id")
  async getDispatcher(@Param("id") id: string) {
    return this.adminService.getDispatcher(id);
  }

  @Patch("dispatchers/:id/status")
  async updateDispatcherStatus(@Param("id") id: string, @Body() body: UpdateDispatcherStatusDto) {
    return this.adminService.updateDispatcherStatus(id, body.status);
  }

  @Get("deliveries")
  async listDeliveries(
    @Query("status") status?: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20"
  ) {
    return this.adminService.listDeliveries(status, Number(page), Number(limit));
  }

  // ─── Food Delivery ─────────────────────────────────────────────────────────────

  @Get("food-vendors")
  async listFoodVendors(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listFoodVendors(Number(page), Number(limit));
  }

  @Get("food-orders")
  async listFoodOrders(
    @Query("status") status?: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20"
  ) {
    return this.adminService.listFoodOrders(status, Number(page), Number(limit));
  }

  // ─── Services ─────────────────────────────────────────────────────────────

  @Get("service-vendors")
  async listServiceVendors(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20"
  ) {
    return this.adminService.listServiceVendors(Number(page), Number(limit));
  }

  @Get("service-bookings")
  async listServiceBookings(
    @Query("status") status?: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20"
  ) {
    return this.adminService.listServiceBookings(status, Number(page), Number(limit));
  }

  // ─── Marketing ─────────────────────────────────────────────────────────────

  @Get("flash-sales")
  async listFlashSales(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listFlashSales(Number(page), Number(limit));
  }

  @Post("flash-sales")
  async createFlashSale(@Body() data: CreateFlashSaleDto) {
    return this.adminService.createFlashSale(data);
  }

  @Get("coupons")
  async listCoupons(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listCoupons(Number(page), Number(limit));
  }

  @Post("coupons")
  async createCoupon(@Body() data: CreateCouponDto) {
    return this.adminService.createCoupon(data);
  }

  // ─── Content Moderation ─────────────────────────────────────────────────

  @Get("content/reels")
  async listReels(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listReels(Number(page), Number(limit));
  }

  @Patch("content/reels/:id/toggle-status")
  async toggleReelStatus(@Param("id") id: string) {
    return this.adminService.toggleReelStatus(id);
  }

  @Get("content/reviews")
  async listReviews(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listReviews(Number(page), Number(limit));
  }

  // Use Delete decorator? Wait, let's just use Post or Patch for delete if we didn't import Delete.
  // Or I can use Patch, but let's see if Delete is imported. It is not. I'll import it or just use Get for now?
  // No, I can use @Patch('content/reviews/:id/delete') because Delete is not imported.
  @Patch("content/reviews/:id/delete")
  async deleteReview(@Param("id") id: string) {
    return this.adminService.deleteReview(id);
  }

  // ─── Referrals ─────────────────────────────────────────────────────────────

  @Get("referrals")
  async listReferrals(@Query("page") page: string = "1", @Query("limit") limit: string = "20") {
    return this.adminService.listReferrals(Number(page), Number(limit));
  }
}
