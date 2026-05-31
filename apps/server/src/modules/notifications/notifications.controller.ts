import { Controller, Get, Post, Param, UseGuards, Req, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiBearerAuth()
@Controller("notifications")
@UseGuards(AuthGuard)
@ApiTags("Notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Get all notifications" })
  @Get()
  findAll(@Req() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.notificationsService.findAll(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @ApiOperation({ summary: "Get unread notification count" })
  @Get("unread-count")
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiParam({ name: "id", type: "string" })
  @Post(":id/read")
  markAsRead(@Req() req: any, @Param("id") id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @ApiOperation({ summary: "Mark all notifications as read" })
  @Post("read-all")
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
