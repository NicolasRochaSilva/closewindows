import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "O nome precisa de ao menos 3 caracteres")
    .max(20, "O nome passa de 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, numeros e _"),
  password: z
    .string()
    .min(6, "A senha precisa de ao menos 6 caracteres")
    .max(72, "A senha passa de 72 caracteres"),
});

export type Credentials = z.infer<typeof credentialsSchema>;
