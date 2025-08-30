import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect: "postgresql",
    schema: "./config/schema.js",
    dbCredentials: {
        url: "postgresql://neondb_owner:npg_jk3sA8OWFqeE@ep-morning-cloud-ad9wmn2q-pooler.c-2.us-east-1.aws.neon.tech/lms%20db?sslmode=require&channel_binding=require"
    }
});
