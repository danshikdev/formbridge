import { app } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
import "./models/user.js";
import "./models/request.js";
import "./models/formIntegration.js";
import "./models/googleAccount.js";
import "./models/integrationEvent.js";
import "./models/notificationSettings.js";
import "./models/formFeedback.js";
import "./models/formMember.js";
import "./models/associations.js";
import { initClient } from "./services/whatsappService.js";
import { startNotificationScheduler } from "./services/notificationScheduler.js";
import { startGoogleFormsPollingScheduler } from "./services/googleFormsPollingScheduler.js";

async function boot() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: env.db.syncAlter });

    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
      initClient(); // запускает WhatsApp в фоне, QR появится в терминале
      startNotificationScheduler();
      startGoogleFormsPollingScheduler();
    });
  } catch (error) {
    console.error("Boot failed:", error.message);
    process.exit(1);
  }
}

boot();
