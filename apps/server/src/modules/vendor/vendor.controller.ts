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
  Query,
} from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorGuard } from "../../guards/vendor.guard";
import { EmailVerifiedGuard } from "../../guards/email-verified.guard";
import { VendorService } from "./vendor.service";
import { OnboardVendorDto } from "./dto/onboard-vendor.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";
import { UpdateTaxInfoDto } from "./dto/update-tax-info.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Vendor")
@ApiBearerAuth()
@Controller("vendor")
@UseGuards(AuthGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @ApiOperation({ summary: "Get vendor profile" })
  @Get("profile")
  @UseGuards(VendorGuard)
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.vendorService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: "Complete vendor onboarding" })
  @Post("onboarding")
  @UseGuards(EmailVerifiedGuard)
  onboard(@Req() req: AuthenticatedRequest, @Body() body: OnboardVendorDto) {
    return this.vendorService.onboard(req.user.id, body);
  }

  @ApiOperation({ summary: "Get vendor stats" })
  @Get("stats")
  @UseGuards(VendorGuard)
  getStats(@Req() req: AuthenticatedRequest) {
    return this.vendorService.getStats(req.user.id);
  }

  @ApiOperation({ summary: "List vendor products" })
  @Get("products")
  @UseGuards(VendorGuard)
  getProducts(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.vendorService.getProducts(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @ApiOperation({ summary: "Create a product" })
  @Post("products")
  @UseGuards(VendorGuard)
  createProduct(@Req() req: AuthenticatedRequest, @Body() body: CreateProductDto) {
    return this.vendorService.createProduct(req.user.id, body);
  }

  @ApiOperation({ summary: "Update a product" })
  @Put("products/:id")
  @UseGuards(VendorGuard)
  updateProduct(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateProductDto
  ) {
    return this.vendorService.updateProduct(req.user.id, id, body);
  }

  @ApiOperation({ summary: "Delete a product" })
  @Delete("products/:id")
  @UseGuards(VendorGuard)
  deleteProduct(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.vendorService.deleteProduct(req.user.id, id);
  }

  @ApiOperation({ summary: "Get vendor orders" })
  @Get("orders")
  @UseGuards(VendorGuard)
  getOrders(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.vendorService.getOrders(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @ApiOperation({ summary: "Get order details" })
  @Get("orders/:id")
  @UseGuards(VendorGuard)
  getOrder(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.vendorService.getOrder(req.user.id, id);
  }

  @ApiOperation({ summary: "Update order status" })
  @Patch("orders/:id/status")
  @UseGuards(VendorGuard)
  updateOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateOrderStatusDto
  ) {
    return this.vendorService.updateOrderStatus(req.user.id, id, body.status);
  }

  @ApiOperation({ summary: "Get vendor earnings" })
  @Get("earnings")
  @UseGuards(VendorGuard)
  getEarnings(@Req() req: AuthenticatedRequest) {
    return this.vendorService.getEarnings(req.user.id);
  }

  @ApiOperation({ summary: "Get vendor transactions" })
  @Get("earnings/transactions")
  @UseGuards(VendorGuard)
  getTransactions(@Req() req: AuthenticatedRequest) {
    return this.vendorService.getTransactions(req.user.id);
  }

  @ApiOperation({ summary: "Get vendor analytics" })
  @Get("earnings/analytics")
  @UseGuards(VendorGuard)
  getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.vendorService.getAnalytics(req.user.id);
  }

  @ApiOperation({ summary: "Update shop details" })
  @Patch("shop")
  @UseGuards(VendorGuard)
  updateShop(@Req() req: AuthenticatedRequest, @Body() body: UpdateShopDto) {
    return this.vendorService.updateShop(req.user.id, body);
  }

  @ApiOperation({ summary: "Update tax information and submit for verification" })
  @Post("tax-info")
  @UseGuards(VendorGuard)
  updateTaxInfo(@Req() req: AuthenticatedRequest, @Body() body: UpdateTaxInfoDto) {
    return this.vendorService.updateTaxInfo(req.user.id, body.tin);
  }

  @ApiOperation({ summary: "Get vendor disputes" })
  @Get("disputes")
  @UseGuards(VendorGuard)
  getDisputes(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.vendorService.getDisputes(req.user.id, Number(page) || 1, Number(limit) || 20);
  }
}
