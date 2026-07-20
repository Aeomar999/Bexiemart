import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { ServicesService } from "./services.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto/create-service.dto";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Vendor Services")
@ApiBearerAuth()
@Controller("vendor/services")
@UseGuards(AuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: "List all services" })
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.servicesService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Get a service by ID" })
  @Get(":id")
  findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.servicesService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: "Create a new service" })
  @ApiBody({ type: CreateServiceDto })
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: "Update a service" })
  @ApiBody({ type: UpdateServiceDto })
  @Put(":id")
  update(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(req.user.id, id, dto);
  }

  @ApiOperation({ summary: "Delete a service" })
  @Delete(":id")
  remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.servicesService.remove(req.user.id, id);
  }
}
