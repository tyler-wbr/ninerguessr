import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const gameModeSchema = z.enum(["casual", "daily"]);

export const startGameSchema = z
  .object({
    mode: gameModeSchema.default("casual"),
    difficulty: difficultySchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "casual" && !data.difficulty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "difficulty required for casual games",
        path: ["difficulty"],
      });
    }
  });

export const guessSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export const createLocationSchema = z.object({
  image_path: z.string().min(1).optional().nullable(),
  lat: z.number().gte(-90).lte(90).optional().nullable(),
  lng: z.number().gte(-180).lte(180).optional().nullable(),
  difficulty: difficultySchema,
  title: z.string().max(120).optional().nullable(),
  hint: z.string().max(500).optional().nullable(),
  is_published: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial();

export const uploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9._-]+$/),
});
