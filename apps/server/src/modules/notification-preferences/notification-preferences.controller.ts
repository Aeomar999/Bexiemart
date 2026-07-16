import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@ApiTags("Notification Preferences")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("notification-preferences")
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({ summary: "Get user notification preferences" })
  get(@Req() req: any) {
    return this.service.get(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: "Update user notification preferences" })
  update(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.service.update(req.user.id, dto);
  }
}
