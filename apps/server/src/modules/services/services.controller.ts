import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { ServicesService } from "./services.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto/create-service.dto";

@ApiTags("Vendor Services")
@Controller("vendor/services")
@UseGuards(AuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: "List all services" })
  @Get()
  findAll(@Req() req: any) { return this.servicesService.findAll(req.user.id); }

  @ApiOperation({ summary: "Get a service by ID" })
  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) { return this.servicesService.findOne(req.user.id, id); }

  @ApiOperation({ summary: "Create a new service" })
  @ApiBody({ type: CreateServiceDto })
  @Post()
  create(@Req() req: any, @Body() dto: CreateServiceDto) { return this.servicesService.create(req.user.id, dto); }

  @ApiOperation({ summary: "Update a service" })
  @ApiBody({ type: UpdateServiceDto })
  @Put(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateServiceDto) { return this.servicesService.update(req.user.id, id, dto); }

  @ApiOperation({ summary: "Delete a service" })
  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) { return this.servicesService.remove(req.user.id, id); }
}
