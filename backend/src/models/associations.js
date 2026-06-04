import { User } from "./user.js";
import { GoogleAccount } from "./googleAccount.js";
import { FormIntegration } from "./formIntegration.js";
import { FormMember } from "./formMember.js";
import { Request } from "./request.js";
import { IntegrationEvent } from "./integrationEvent.js";
import { FormFeedback } from "./formFeedback.js";
import { NotificationSettings } from "./notificationSettings.js";

// User 1:1 GoogleAccount
User.hasOne(GoogleAccount, { foreignKey: "userId" });
GoogleAccount.belongsTo(User, { foreignKey: "userId" });

// User 1:N FormIntegration
User.hasMany(FormIntegration, { foreignKey: "userId" });
FormIntegration.belongsTo(User, { foreignKey: "userId" });

// GoogleAccount 1:N FormIntegration
GoogleAccount.hasMany(FormIntegration, { foreignKey: "googleAccountId" });
FormIntegration.belongsTo(GoogleAccount, { foreignKey: "googleAccountId" });



// FormIntegration 1:N IntegrationEvent
FormIntegration.hasMany(IntegrationEvent, { foreignKey: "integrationId" });
IntegrationEvent.belongsTo(FormIntegration, { foreignKey: "integrationId" });

// Request 1:N IntegrationEvent
Request.hasMany(IntegrationEvent, { foreignKey: "requestId" });
IntegrationEvent.belongsTo(Request, { foreignKey: "requestId" });

// User 1:N FormFeedback
User.hasMany(FormFeedback, { foreignKey: "userId" });
FormFeedback.belongsTo(User, { foreignKey: "userId" });

// User 1:N NotificationSettings
User.hasMany(NotificationSettings, { foreignKey: "userId" });
NotificationSettings.belongsTo(User, { foreignKey: "userId" });

// FormMember associations
FormMember.belongsTo(User, { foreignKey: "memberId", as: "member" });
FormMember.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
User.hasMany(FormMember, { foreignKey: "memberId", as: "sharedForms" });
User.hasMany(FormMember, { foreignKey: "ownerId", as: "ownedShares" });
