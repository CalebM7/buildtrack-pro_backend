import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  tenantId = null,
  actor = null,
  action,
  entityType,
  entityId,
  description,
  request,
  changes,
  severity = 'info',
  metadata
})  => {
  return AuditLog.create({
    tenantId,
    actor,
    action,
    entityType,
    entityId,
    description,
    request,
    changes,
    severity,
    metadata,
  });
};