// src/lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'; // <--- CHANGE THIS LINE
import postgres from 'postgres'; // <--- ADD THIS LINE

// This is the standard way to initialize postgres.js
const queryClient = postgres(process.env.DATABASE_URL!);

// Then pass the client to Drizzle ORM
export const db = drizzle(queryClient); // <--- CHANGE THIS LINE