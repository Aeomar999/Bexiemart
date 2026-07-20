import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { ReelsService } from "./reels.service";
import { CreateReelDto, UpdateReelDto } from "./dto/create-reel.dto";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Vendor Reels")
@ApiBearerAuth()
@Controller("vendor/reels")
@UseGuards(AuthGuard)
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @ApiOperation({ summary: "List all reels" })
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.reelsService.findAll(req.user.id);
  }
  @ApiOperation({ summary: "Get a reel by ID" })
  @Get(":id")
  findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.reelsService.findOne(req.user.id, id);
  }
  @ApiOperation({ summary: "Create a new reel" })
  @ApiBody({ type: CreateReelDto })
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReelDto) {
    return this.reelsService.create(req.user.id, dto);
  }
  @ApiOperation({ summary: "Update a reel" })
  @ApiBody({ type: UpdateReelDto })
  @Put(":id")
  update(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateReelDto) {
    return this.reelsService.update(req.user.id, id, dto);
  }
  @ApiOperation({ summary: "Delete a reel" })
  @Delete(":id")
  remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.reelsService.remove(req.user.id, id);
  }
}
