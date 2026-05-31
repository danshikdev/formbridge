export function requireAdmin(req, res, next) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
}
