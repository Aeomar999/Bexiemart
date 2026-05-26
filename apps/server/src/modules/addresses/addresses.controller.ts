import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Controller("addresses")
@UseGuards(AuthGuard)
@ApiTags("Addresses")
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: "Get all addresses" })
  @Get()
  findAll(@Req() req: any) {
    return this.addressesService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Create a new address" })
  @ApiBody({ type: CreateAddressDto })
  @Post()
  create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: "Update an address" })
  @ApiBody({ type: UpdateAddressDto })
  @Put(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(req.user.id, id, dto);
  }

  @ApiOperation({ summary: "Delete an address" })
  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.addressesService.remove(req.user.id, id);
  }

  @ApiOperation({ summary: "Set default address" })
  @Patch(":id/default")
  setDefault(@Req() req: any, @Param("id") id: string) {
    return this.addressesService.setDefault(req.user.id, id);
  }
}
