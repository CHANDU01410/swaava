import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "./.mongo_data");

fs.mkdirSync(dbPath, { recursive: true });

console.log("[MongoDB Server] Initializing MongoDB on port 27017...");

try {
    const mongod = await MongoMemoryServer.create({
        instance: {
            port: 27017,
            dbPath: dbPath,
            storageEngine: "wiredTiger"
        }
    });
    console.log(`[MongoDB Server] Ready and listening at: ${mongod.getUri()}`);

    const handleExit = async () => {
        console.log("[MongoDB Server] Shutting down...");
        await mongod.stop();
        process.exit(0);
    };

    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
} catch (err) {
    console.error("[MongoDB Server] Failed to start:", err);
}
