// Must be the first import so Sentry can instrument other modules.
import "./instrument";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import helmet from "helmet";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
    // Capture the unparsed request body so the Paystack webhook handler can
    // verify the HMAC signature against the exact bytes Paystack signed.
    rawBody: true,
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

  // Swagger exposes the full API surface; only mount it outside production.
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("BexieMart API")
      .setDescription("Campus marketplace API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`BexieMart API running on port ${port}`);
}
bootstrap();
