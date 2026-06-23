import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { DispatcherGuard } from "../../guards/dispatcher.guard";
import { DispatcherService } from "./dispatcher.service";

import {
  CreateDispatcherDto,
  ToggleStatusDto,
  UpdateLocationDto,
  UpdateTaskStatusDto,
  WithdrawEarningsDto,
} from "./dto/dispatcher.dto";

@ApiBearerAuth()
@Controller("dispatcher")
@UseGuards(AuthGuard)
@ApiTags("Dispatcher")
export class DispatcherController {
  constructor(private readonly dispatcherService: DispatcherService) {}

  @ApiOperation({ summary: "Get dispatcher profile" })
  @Get("profile")
  @UseGuards(DispatcherGuard)
  getProfile(@Req() req: any) {
    return this.dispatcherService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: "Create dispatcher profile" })
  @Post("profile")
  createProfile(@Req() req: any, @Body() dto: CreateDispatcherDto) {
    return this.dispatcherService.createProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: "Toggle online status" })
  @Put("status")
  @UseGuards(DispatcherGuard)
  toggleStatus(@Req() req: any, @Body() data: ToggleStatusDto) {
    return this.dispatcherService.updateStatus(req.user.id, data.status);
  }

  @ApiOperation({ summary: "Update location" })
  @Put("location")
  @UseGuards(DispatcherGuard)
  updateLocation(@Req() req: any, @Body() data: UpdateLocationDto) {
    return this.dispatcherService.updateLocation(req.user.id, data.lat, data.lng);
  }

  @ApiOperation({ summary: "Get available tasks" })
  @Get("tasks/available")
  @UseGuards(DispatcherGuard)
  getAvailableTasks(@Req() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.dispatcherService.getAvailableTasks(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 20
    );
  }

  @ApiOperation({ summary: "Get my active or completed tasks" })
  @Get("tasks")
  @UseGuards(DispatcherGuard)
  getMyTasks(
    @Req() req: any,
    @Query("status") status: "active" | "completed",
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.dispatcherService.getMyTasks(
      req.user.id,
      status || "active",
      Number(page) || 1,
      Number(limit) || 20
    );
  }

  @ApiOperation({ summary: "Accept a task" })
  @Post("tasks/:id/accept")
  @UseGuards(DispatcherGuard)
  acceptTask(@Req() req: any, @Param("id") taskId: string) {
    return this.dispatcherService.acceptTask(req.user.id, taskId);
  }

  @ApiOperation({ summary: "Update task status" })
  @Put("tasks/:id/status")
  @UseGuards(DispatcherGuard)
  updateTaskStatus(
    @Req() req: any,
    @Param("id") taskId: string,
    @Body() data: UpdateTaskStatusDto
  ) {
    return this.dispatcherService.updateTaskStatus(req.user.id, taskId, data.status);
  }

  // --- Earnings & Wallet ---

  @ApiOperation({ summary: "Get dispatcher earnings" })
  @Get("earnings")
  @UseGuards(DispatcherGuard)
  getEarnings(@Req() req: any) {
    return this.dispatcherService.getEarnings(req.user.id);
  }

  @ApiOperation({ summary: "Get dispatcher transactions" })
  @Get("earnings/transactions")
  @UseGuards(DispatcherGuard)
  getTransactions(@Req() req: any) {
    return this.dispatcherService.getTransactions(req.user.id);
  }

  @ApiOperation({ summary: "Get dispatcher analytics" })
  @Get("earnings/analytics")
  @UseGuards(DispatcherGuard)
  getAnalytics(@Req() req: any) {
    return this.dispatcherService.getAnalytics(req.user.id);
  }

  @ApiOperation({ summary: "Withdraw dispatcher earnings" })
  @Post("earnings/withdraw")
  @UseGuards(DispatcherGuard)
  withdrawEarnings(@Req() req: any, @Body() data: WithdrawEarningsDto) {
    return this.dispatcherService.withdrawEarnings(req.user.id, data.amount, data.destination);
  }
}
