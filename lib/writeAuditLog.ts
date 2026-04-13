/** Client-side audit log helper for admin actions. */
export async function writeAuditLog(
  actionType: string,
  description: string,
  targetId?: string,
) {
  const actor = typeof window !== "undefined" ? localStorage.getItem("adminEmail") || "admin" : "admin";
  const actorRole = typeof window !== "undefined" ? localStorage.getItem("adminRole") || "admin" : "admin";

  fetch("/api/audit-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor,
      actor_role: actorRole === "super_admin" ? "super_admin" : "admin",
      action_type: actionType,
      description,
      target_id: targetId ?? null,
    }),
  }).catch((err) => console.error("[auditLog] Failed:", err));
}
