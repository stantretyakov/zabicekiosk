import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue, Timestamp } from '@google-cloud/firestore';

const DAY_MS = 24 * 60 * 60 * 1000;

function coercePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function coercePositiveInteger(value: unknown): number | null {
  const number = coercePositiveNumber(value);
  if (number === null) return null;
  const rounded = Math.round(number);
  return rounded > 0 ? rounded : null;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export default async function adminSettings(app: FastifyInstance) {
  const db = getDb();
  const settingsSchema = z.record(z.any());

  app.get('/settings', { preHandler: requireAdmin }, async () => {
    const snap = await db.collection('settings').doc('global').get();
    return snap.exists ? snap.data() : {};
  });

  app.put('/settings', { preHandler: requireAdmin }, async req => {
    const body = settingsSchema.parse(req.body);
    const settingsRef = db.collection('settings').doc('global');
    const previousSnap = await settingsRef.get();
    const previousSettings = previousSnap.exists ? previousSnap.data() : {};

    await settingsRef.set(
      { ...body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    const snap = await settingsRef.get();
    const savedSettings = snap.data() || {};

    await syncPassValidityWithConfig(
      db,
      Array.isArray((previousSettings as any)?.passes)
        ? ((previousSettings as any).passes as any[])
        : undefined,
      Array.isArray((savedSettings as any)?.passes)
        ? ((savedSettings as any).passes as any[])
        : undefined,
    );

    return savedSettings;
  });
}

async function syncPassValidityWithConfig(
  db: FirebaseFirestore.Firestore,
  previousPassConfigs: any[] | undefined,
  currentPassConfigs: any[] | undefined,
) {
  if (!currentPassConfigs || currentPassConfigs.length === 0) {
    return;
  }

  const previousValidityBySessions = new Map<number, number>();
  for (const config of previousPassConfigs || []) {
    const sessions = coercePositiveInteger(config?.sessions ?? config?.planSize);
    const validity = coercePositiveNumber(config?.validityDays);
    if (sessions && validity) {
      previousValidityBySessions.set(sessions, validity);
    }
  }

  const configsToUpdate = currentPassConfigs
    .filter(config => config?.active !== false)
    .map(config => {
      const sessions = coercePositiveInteger(config?.sessions ?? config?.planSize);
      const validity = coercePositiveNumber(config?.validityDays);
      return { sessions, validity };
    })
    .filter((c): c is { sessions: number; validity: number } => Boolean(c.sessions && c.validity));

  if (configsToUpdate.length === 0) {
    return;
  }

  for (const { sessions, validity } of configsToUpdate) {
    const previousValidity = previousValidityBySessions.get(sessions);
    if (previousValidity !== undefined && previousValidity === validity) {
      continue;
    }

    const passesSnap = await db
      .collection('passes')
      .where('planSize', '==', sessions)
      .where('revoked', '==', false)
      .get();

    if (passesSnap.empty) {
      continue;
    }

    const updates = passesSnap.docs
      .map(doc => {
        const data = doc.data() as any;
        const purchasedAt = data.purchasedAt?.toDate?.();
        if (!purchasedAt) {
          return null;
        }
        const newExpiryDate = new Date(purchasedAt.getTime() + validity * DAY_MS);
        const currentExpiryDate = data.expiresAt?.toDate?.();
        const currentValidity = coercePositiveNumber(data.validityDays);
        if (
          currentExpiryDate &&
          Math.abs(currentExpiryDate.getTime() - newExpiryDate.getTime()) < 1000 &&
          currentValidity === validity
        ) {
          return null;
        }
        return {
          ref: doc.ref,
          expiresAt: Timestamp.fromDate(newExpiryDate),
        };
      })
      .filter((u): u is { ref: FirebaseFirestore.DocumentReference; expiresAt: Timestamp } =>
        Boolean(u),
      );

    if (updates.length === 0) {
      continue;
    }

    for (const chunk of chunkArray(updates, 450)) {
      const batch = db.batch();
      for (const update of chunk) {
        batch.update(update.ref, {
          expiresAt: update.expiresAt,
          validityDays: validity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }
}
