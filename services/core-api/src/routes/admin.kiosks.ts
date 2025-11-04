import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { FieldValue } from '@google-cloud/firestore';

export default async function adminKiosks(app: FastifyInstance) {
  const db = getDb();

  const settingsRef = db.collection('settings').doc('kiosk');

  const settingsSchema = z.object({
    adminPin: z.string().regex(/^\d{4}$/),
    maxIdleMinutes: z.number().int().min(1).max(120),
    autoLogoutEnabled: z.boolean(),
    soundEnabled: z.boolean(),
    cameraFacingMode: z.enum(['user', 'environment']),
    scanCooldownSec: z.number().int().min(0).max(60),
  });

  const configureSchema = z.object({
    kioskId: z.string(),
    adminPin: z.string().regex(/^\d{4}$/),
    location: z.string().trim().min(1),
    description: z.string().trim().optional(),
    scannerPosition: z.enum(['left', 'right', 'top']),
    soundEnabled: z.boolean(),
    cameraFacingMode: z.enum(['user', 'environment']),
    scanCooldownSec: z.number().int().min(0).max(60),
    maxIdleMinutes: z.number().int().min(1).max(120),
  });

  function generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  app.get('/kiosks/settings', { preHandler: requireAdmin }, async () => {
    const snap = await settingsRef.get();
    let settings: any;
    if (snap.exists) {
      settings = snap.data();
    } else {
      settings = {
        adminPin: generatePin(),
        maxIdleMinutes: 30,
        autoLogoutEnabled: true,
        soundEnabled: true,
        cameraFacingMode: 'environment',
        scanCooldownSec: 2,
      };
      await settingsRef.set(settings);
    }

    const kiosksSnap = await db.collection('kiosks').get();
    const kiosks = kiosksSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        registeredAt: data.registeredAt?.toDate().toISOString(),
        lastSeen: data.lastSeen?.toDate().toISOString(),
        version: data.version,
        location: data.location,
        description: data.description,
      };
    });

    return { settings, kiosks };
  });

  app.put('/kiosks/settings', { preHandler: requireAdmin }, async req => {
    const body = settingsSchema.parse(req.body);
    await settingsRef.set({ ...body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const snap = await settingsRef.get();
    return snap.data();
  });

  app.post('/kiosks/verify-pin', async (req, reply) => {
    const { pin } = z.object({ pin: z.string() }).parse(req.body);
    const snap = await settingsRef.get();
    const data = snap.data();
    if (data?.adminPin === pin) {
      return { status: 'ok' };
    }
    reply.code(400);
    return { message: 'Invalid PIN' };
  });

  app.post('/kiosks/configure', async (req, reply) => {
    const body = configureSchema.parse(req.body);
    const snap = await settingsRef.get();
    const data = snap.data();
    if (data?.adminPin !== body.adminPin) {
      reply.code(400);
      return { message: 'Invalid PIN' };
    }
    const { kioskId, adminPin: _adminPin, ...config } = body;
    await db
      .collection('kiosks')
      .doc(kioskId)
      .set({ ...config, configuredAt: FieldValue.serverTimestamp() }, { merge: true });
    return { status: 'ok' };
  });
}

