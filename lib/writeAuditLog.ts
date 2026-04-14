/** Client-side audit log helper for admin actions. Actor identity is set server-side from the session. */
export async function writeAuditLog(
  actionType: string,
  description: string,
  targetId?: string,
) {
  fetch("/api/audit-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_type: actionType,
      description,
      target_id: targetId ?? null,
    }),
  }).catch((err) => console.error("[auditLog] Failed:", err));
}
