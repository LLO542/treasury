import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

const bootstrap = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server", error);
  process.exit(1);
});
