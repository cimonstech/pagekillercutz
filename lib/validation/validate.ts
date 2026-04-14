import type { z } from "zod";

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; error: string; details: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const details: Record<string, string> = {};
  for (const err of result.error.issues) {
    const field = err.path.map(String).join(".") || "_root";
    details[field] = err.message;
  }

  return {
    success: false,
    error: "Validation failed",
    details,
  };
}
