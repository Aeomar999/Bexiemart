import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards, Query } from "@nestjs/common";
import { StoryService } from "./story.service";
import { AuthGuard } from "../../guards/auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CreateStoryDto } from "./dto/create-story.dto";

@ApiTags("Stories")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("story")
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  @ApiOperation({ summary: "Get active stories" })
  getActiveStories(@Req() req: any, @Query("vendorId") vendorId?: string) {
    return this.storyService.getActiveStories(req.user.id, vendorId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new story" })
  createStory(@Req() req: any, @Body() body: CreateStoryDto) {
    return this.storyService.createStory(req.user.id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a story" })
  deleteStory(@Req() req: any, @Param("id") id: string) {
    return this.storyService.deleteStory(req.user.id, id);
  }

  @Post(":id/view")
  @ApiOperation({ summary: "Record a story view" })
  recordView(@Req() req: any, @Param("id") id: string) {
    return this.storyService.recordView(req.user.id, id);
  }
}
