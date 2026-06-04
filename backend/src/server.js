import { app } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";

// Импорт моделей в правильном порядке зависимостей
import { User } from "./models/user.js";
import { GoogleAccount } from "./models/googleAccount.js";
import { FormIntegration } from "./models/formIntegration.js";
import { Request } from "./models/request.js";
import { IntegrationEvent } from "./models/integrationEvent.js";
import { NotificationSettings } from "./models/notificationSettings.js";
import { FormFeedback } from "./models/formFeedback.js";
import { FormMember } from "./models/formMember.js";
import "./models/associations.js";

import { initClient } from "./services/whatsappService.js";
import { startNotificationScheduler } from "./services/notificationScheduler.js";
import { startGoogleFormsPollingScheduler } from "./services/googleFormsPollingScheduler.js";

async function boot() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Явный порядок синхронизации — от независимых к зависимым
    await User.sync({ alter: env.db.syncAlter });
    await GoogleAccount.sync({ alter: env.db.syncAlter });
    await FormIntegration.sync({ alter: env.db.syncAlter });
    await Request.sync({ alter: env.db.syncAlter });
    await IntegrationEvent.sync({ alter: env.db.syncAlter });
    await NotificationSettings.sync({ alter: env.db.syncAlter });
    await FormFeedback.sync({ alter: env.db.syncAlter });
    await FormMember.sync({ alter: env.db.syncAlter });

    console.log("DB synced");

    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
      initClient();
      startNotificationScheduler();
      startGoogleFormsPollingScheduler();
    });
  } catch (error) {
    console.error("Boot failed:", error.message);
    process.exit(1);
  }
}

boot();