import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { DispatcherService } from "./dispatcher.service";

@Controller("dispatcher")
@UseGuards(AuthGuard)
@ApiTags("Dispatcher")
export class DispatcherController {
  constructor(private readonly dispatcherService: DispatcherService) {}

  @ApiOperation({ summary: "Get dispatcher profile" })
  @Get("profile")
  getProfile(@Req() req: any) {
    return this.dispatcherService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: "Create dispatcher profile" })
  @Post("profile")
  createProfile(@Req() req: any, @Body() dto: any) {
    return this.dispatcherService.createProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: "Toggle online status" })
  @Put("status")
  toggleStatus(@Req() req: any, @Body() data: { status: "ONLINE" | "OFFLINE" }) {
    return this.dispatcherService.updateStatus(req.user.id, data.status);
  }

  @ApiOperation({ summary: "Update location" })
  @Put("location")
  updateLocation(@Req() req: any, @Body() data: { lat: number; lng: number }) {
    return this.dispatcherService.updateLocation(req.user.id, data.lat, data.lng);
  }

  @ApiOperation({ summary: "Get available tasks" })
  @Get("tasks/available")
  getAvailableTasks(@Req() req: any) {
    return this.dispatcherService.getAvailableTasks(req.user.id);
  }

  @ApiOperation({ summary: "Get my active or completed tasks" })
  @Get("tasks")
  getMyTasks(@Req() req: any, @Query("status") status: "active" | "completed") {
    return this.dispatcherService.getMyTasks(req.user.id, status || "active");
  }

  @ApiOperation({ summary: "Accept a task" })
  @Post("tasks/:id/accept")
  acceptTask(@Req() req: any, @Param("id") taskId: string, @Body() data: { type: "ride" | "delivery" }) {
    return this.dispatcherService.acceptTask(req.user.id, taskId, data.type);
  }

  @ApiOperation({ summary: "Update task status" })
  @Put("tasks/:id/status")
  updateTaskStatus(@Req() req: any, @Param("id") taskId: string, @Body() data: { status: string, type: "ride" | "delivery" }) {
    return this.dispatcherService.updateTaskStatus(req.user.id, taskId, data.status, data.type);
  }

  // --- Earnings & Wallet ---

  @ApiOperation({ summary: "Get dispatcher earnings" })
  @Get("earnings")
  getEarnings(@Req() req: any) {
    return this.dispatcherService.getEarnings(req.user.id);
  }

  @ApiOperation({ summary: "Get dispatcher transactions" })
  @Get("earnings/transactions")
  getTransactions(@Req() req: any) {
    return this.dispatcherService.getTransactions(req.user.id);
  }

  @ApiOperation({ summary: "Get dispatcher analytics" })
  @Get("earnings/analytics")
  getAnalytics(@Req() req: any) {
    return this.dispatcherService.getAnalytics(req.user.id);
  }

  @ApiOperation({ summary: "Withdraw dispatcher earnings" })
  @Post("earnings/withdraw")
  withdrawEarnings(@Req() req: any, @Body() data: { amount: number, destination: string }) {
    return this.dispatcherService.withdrawEarnings(req.user.id, data.amount, data.destination);
  }
}
