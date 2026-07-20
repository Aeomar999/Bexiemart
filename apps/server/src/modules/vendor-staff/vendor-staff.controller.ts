import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorStaffService } from "./vendor-staff.service";
import { CreateStaffDto, UpdateStaffDto } from "./dto/staff.dto";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Vendor Staff")
@ApiBearerAuth()
@Controller("vendor/staff")
@UseGuards(AuthGuard)
export class VendorStaffController {
  constructor(private readonly service: VendorStaffService) {}

  @ApiOperation({ summary: "List all staff" })
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.service.findAll(req.user.id);
  }
  @ApiOperation({ summary: "Create a staff member" })
  @ApiBody({ type: CreateStaffDto })
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateStaffDto) {
    return this.service.create(req.user.id, dto);
  }
  @ApiOperation({ summary: "Update a staff member" })
  @ApiBody({ type: UpdateStaffDto })
  @Put(":id")
  update(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(req.user.id, id, dto);
  }
  @ApiOperation({ summary: "Delete a staff member" })
  @Delete(":id")
  remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.remove(req.user.id, id);
  }
  @ApiOperation({ summary: "Toggle staff active status" })
  @Patch(":id/toggle")
  toggle(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.toggle(req.user.id, id);
  }
}
