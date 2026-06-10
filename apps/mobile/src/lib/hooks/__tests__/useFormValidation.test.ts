import { renderHook, act } from "@testing-library/react-native";
import { z } from "zod";
import { useFormValidation } from "../use-form-validation";

describe("useFormValidation", () => {
  const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  it("should initialize with empty errors", () => {
    const { result } = renderHook(() => useFormValidation(schema));
    expect(result.current.errors).toEqual({});
  });

  it("should validate successfully", () => {
    const { result } = renderHook(() => useFormValidation(schema));

    let isValid;
    act(() => {
      isValid = result.current.validate({ email: "test@example.com", password: "password123" });
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it("should construct error dictionary on failure", () => {
    const { result } = renderHook(() => useFormValidation(schema));

    let isValid;
    act(() => {
      isValid = result.current.validate({ email: "invalid", password: "123" });
    });

    expect(isValid).toBe(false);
    expect(result.current.errors).toEqual({
      email: "Invalid email",
      password: "Password must be at least 6 characters",
    });
  });

  it("should set field errors manually", () => {
    const { result } = renderHook(() => useFormValidation(schema));

    act(() => {
      result.current.setFieldError("email", "Email already in use");
    });

    expect(result.current.errors).toEqual({
      email: "Email already in use",
    });
  });

  it("should clear errors", () => {
    const { result } = renderHook(() => useFormValidation(schema));

    act(() => {
      result.current.setFieldError("email", "Email already in use");
    });

    expect(result.current.errors).toEqual({ email: "Email already in use" });

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });
});
