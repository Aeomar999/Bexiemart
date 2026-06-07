import { useState, useCallback } from "react";
import { z } from "zod";

export function useFormValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(
    (data: unknown): data is z.output<T> => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path.length > 0) {
              formattedErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(formattedErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  const setFieldError = useCallback((field: string, msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }, []);

  return { errors, validate, clearErrors, setFieldError, setErrors };
}
