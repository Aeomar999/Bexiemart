import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CollectionsService } from "./collections.service";
import { AuthGuard } from "../../guards/auth.guard";

@ApiBearerAuth()
@Controller("collections")
@UseGuards(AuthGuard)
@ApiTags("Collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @ApiOperation({ summary: "Get all user collections" })
  @Get()
  getUserCollections(@Req() req: any) {
    return this.collectionsService.getUserCollections(req.user.id);
  }

  @ApiOperation({ summary: "Get a specific collection" })
  @Get(":id")
  getCollection(@Req() req: any, @Param("id") id: string) {
    return this.collectionsService.getCollection(req.user.id, id);
  }

  @ApiOperation({ summary: "Create a new collection" })
  @Post()
  createCollection(@Req() req: any, @Body() body: { name: string; description?: string }) {
    return this.collectionsService.createCollection(req.user.id, body.name, body.description);
  }

  @ApiOperation({ summary: "Delete a collection" })
  @Delete(":id")
  deleteCollection(@Req() req: any, @Param("id") id: string) {
    return this.collectionsService.deleteCollection(req.user.id, id);
  }

  @ApiOperation({ summary: "Add item to collection" })
  @Post(":id/items")
  addItemToCollection(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { productId: string }
  ) {
    return this.collectionsService.addItemToCollection(req.user.id, id, body.productId);
  }

  @ApiOperation({ summary: "Remove item from collection" })
  @Delete(":id/items/:productId")
  removeItemFromCollection(
    @Req() req: any,
    @Param("id") id: string,
    @Param("productId") productId: string
  ) {
    return this.collectionsService.removeItemFromCollection(req.user.id, id, productId);
  }
}
