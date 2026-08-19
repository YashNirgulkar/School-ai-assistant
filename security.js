const ROLES = ["student", "parent", "teacher", "principal"];

const rolePermissions = {
  student: ["attendance:own", "attendance:recent", "escalation:teacher"],
  parent: ["attendance:child", "attendance:recent", "escalation:teacher", "escalation:management"],
  teacher: ["attendance:class:write", "attendance:class:read"],
  principal: ["attendance:school:analytics", "escalation:management"]
};

const unsafePatterns = [
  /ignore (all |any |the )?(previous|prior) instructions/i,
  /(reveal|show|print|extract) (me )?(the )?(system|developer) prompt/i,
  /(show|give|reveal|print) (me )?(your )?(api key|token|secret|credentials?)/i,
  /act as (an? )?(admin|principal|teacher) because/i,
  /bypass (security|permissions|authorization)/i,
  /jailbreak/i
];

function hasPermission(role, permission) {
  return Boolean(rolePermissions[role] && rolePermissions[role].includes(permission));
}

function looksUnsafe(message) {
  return unsafePatterns.some((pattern) => pattern.test(message || ""));
}

function validateSessionInput(role, identityId) {
  return ROLES.includes(role) && typeof identityId === "string" && identityId.length > 2;
}

function safeText(value, maxLength) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 600);
}

module.exports = { ROLES, rolePermissions, hasPermission, looksUnsafe, validateSessionInput, safeText };
