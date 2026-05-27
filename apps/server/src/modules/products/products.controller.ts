import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { ProductsService } from "./products.service";
import { QueryProductsDto } from "./dto/query-products.dto";

@Controller("products")
@UseGuards(AuthGuard)
@ApiTags("Products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: "Get all products" })
  @Get()
  findAll(@Query() dto: QueryProductsDto) {
    return this.productsService.findAll(dto);
  }

  @ApiOperation({ summary: "Get product categories" })
  @Get("categories")
  getCategories() {
    return this.productsService.getCategories();
  }

  @ApiOperation({ summary: "Get a product by ID" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: "Get store profile by vendor ID" })
  @Get("store/:id")
  getStore(@Param("id") id: string) {
    return this.productsService.getStore(id);
  }
}
