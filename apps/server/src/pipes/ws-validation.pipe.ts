import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";

@Injectable()
export class WsValidationPipe implements PipeTransform {
  constructor(private readonly dtoClass: new () => object) {}

  async transform(value: unknown): Promise<object> {
    if (!value || typeof value !== "object") {
      throw new BadRequestException("Invalid message payload");
    }

    const dto = plainToInstance(this.dtoClass, value, {
      enableImplicitConversion: true,
    });

    const errors: ValidationError[] = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat()
        .join("; ");
      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return dto;
  }
}
