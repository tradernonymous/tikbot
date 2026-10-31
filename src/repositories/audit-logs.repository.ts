import { prisma } from '@/lib/prisma';

export interface PublicAuditLogDTO {
  id: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: any;
}

export async function listAuditLogs(limit = 100): Promise<PublicAuditLogDTO[]> {
  try {
    const rows = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp.toISOString(),
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      ipAddress: r.ipAddress,
      metadata: r.metadata,
    }));
  } catch {
    return [];
  }
}

export async function recordAuditLog(data: {
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: any;
}): Promise<PublicAuditLogDTO | null> {
  try {
    const row = await prisma.auditLog.create({
      data: {
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        ipAddress: data.ipAddress || null,
        metadata: data.metadata || null,
      },
    });

    return {
      id: row.id,
      timestamp: row.timestamp.toISOString(),
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      ipAddress: row.ipAddress,
      metadata: row.metadata,
    };
  } catch {
    return null;
  }
}
