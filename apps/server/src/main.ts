import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { rawBodyParser } from "./middleware/raw-body.middleware";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import helmet from "helmet";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  app.set("trust proxy", 1);
  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["bexiemart://", "exp://", "http://localhost:3001", "https://admin.bexiemart.com"],
    credentials: true,
  });

  const uploadDir = join(process.cwd(), "uploads");
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: "/uploads/" });

  const publicDir = join(process.cwd(), "public");
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  app.useStaticAssets(publicDir, { prefix: "/" });

  app.use(rawBodyParser("/webhooks/paystack"));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  const config = new DocumentBuilder()
    .setTitle("BexieMart API")
    .setDescription("Campus marketplace API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`BexieMart API running on port ${port}`);
}
bootstrap();
