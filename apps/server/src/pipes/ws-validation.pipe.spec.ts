import { WsValidationPipe } from "./ws-validation.pipe";
import { BadRequestException } from "@nestjs/common";
import { IsString, IsNotEmpty } from "class-validator";

class TestDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

describe("WsValidationPipe", () => {
  let pipe: WsValidationPipe;

  beforeEach(() => {
    pipe = new WsValidationPipe(TestDto);
  });

  it("should be defined", () => {
    expect(pipe).toBeDefined();
  });

  it("should validate and transform valid data", async () => {
    const validData = { message: "hello" };
    const result = await pipe.transform(validData);
    expect(result).toEqual(validData);
    expect(result).toBeInstanceOf(TestDto);
  });

  it("should throw BadRequestException for invalid payload type", async () => {
    await expect(pipe.transform(null)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform("not-an-object")).rejects.toThrow(BadRequestException);
  });

  it("should throw BadRequestException for missing required fields", async () => {
    const invalidData = {};
    await expect(pipe.transform(invalidData)).rejects.toThrow(BadRequestException);
  });

  it("should strip non-whitelisted properties", async () => {
    const invalidData = { message: "hello", extra: "should-fail" };
    // The pipe has forbidNonWhitelisted: true, so it should throw an error instead of just stripping it.
    await expect(pipe.transform(invalidData)).rejects.toThrow(BadRequestException);
  });
});
