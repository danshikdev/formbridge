import { FormIntegration } from "../models/formIntegration.js";
import { FormMember } from "../models/formMember.js";
import { User } from "../models/user.js";

// Verify requester is the owner AND form is configured (scenarioConfiguredAt set)
async function requireOwner(formId, userId) {
  const integration = await FormIntegration.findOne({ where: { formId } });
  if (!integration) {
    const err = new Error("Form not found"); err.status = 404; throw err;
  }
  if (integration.userId !== userId) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  if (!integration.scenarioConfiguredAt) {
    const err = new Error("Form must be fully configured before sharing"); err.status = 400; throw err;
  }
  return integration;
}

// GET /api/forms/:formId/members
export async function listMembers(req, res) {
  try {
    await requireOwner(req.params.formId, req.userId);
    const members = await FormMember.findAll({
      where: { formId: req.params.formId },
      include: [{ model: User, as: "member", attributes: ["id", "fullName", "email"] }]
    });
    return res.json({ items: members.map((m) => ({
      id: m.id,
      formId: m.formId,
      role: m.role,
      createdAt: m.createdAt,
      member: m.member
    })) });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// POST /api/forms/:formId/members  { email }
export async function inviteMember(req, res) {
  try {
    const integration = await requireOwner(req.params.formId, req.userId);
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const targetUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!targetUser) return res.status(404).json({ error: "User with this email not found" });
    if (targetUser.id === req.userId) return res.status(400).json({ error: "Cannot invite yourself" });

    const [member, created] = await FormMember.findOrCreate({
      where: { formId: integration.formId, memberId: targetUser.id },
      defaults: { ownerId: req.userId, role: "viewer" }
    });

    if (!created) return res.status(409).json({ error: "User already has access" });

    return res.status(201).json({
      id: member.id,
      formId: member.formId,
      role: member.role,
      member: { id: targetUser.id, fullName: targetUser.fullName, email: targetUser.email }
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// DELETE /api/forms/:formId/members/:memberId
export async function removeMember(req, res) {
  try {
    await requireOwner(req.params.formId, req.userId);
    const deleted = await FormMember.destroy({
      where: { formId: req.params.formId, memberId: req.params.memberId }
    });
    if (!deleted) return res.status(404).json({ error: "Member not found" });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
