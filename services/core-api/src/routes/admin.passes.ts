import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { Timestamp, FieldValue } from '@google-cloud/firestore';

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

export default async function adminPasses(app: FastifyInstance) {
  const db = getDb();

  app.get('/passes', { preHandler: requireAdmin }, async req => {
    const qsSchema = z.object({
      pageSize: z.coerce.number().min(1).max(50).default(20),
      pageToken: z.string().optional(),
      clientId: z.string().optional(),
    });
    const { pageSize, pageToken, clientId } = qsSchema.parse(req.query);

    let query: FirebaseFirestore.Query = db.collection('passes');
    if (clientId) {
      query = query
        .where('clientId', '==', clientId)
        .where('revoked', '==', false);
    } else {
      query = query.orderBy('purchasedAt', 'desc');
      if (pageToken) {
        const snap = await db.collection('passes').doc(pageToken).get();
        if (snap.exists) query = query.startAfter(snap);
      }
    }

    const snap = await (clientId
      ? query.get()
      : query.limit(pageSize + 1).get());
    let docs = snap.docs;

    if (clientId) {
      docs = docs.sort((a, b) => {
        const aTs = (a.data() as any).purchasedAt?.toMillis?.() || 0;
        const bTs = (b.data() as any).purchasedAt?.toMillis?.() || 0;
        return bTs - aTs;
      });
    }

    const items = await Promise.all(
      docs.slice(0, pageSize).map(async d => {
        const data = d.data() as any;
        const clientSnap = await db.collection('clients').doc(data.clientId).get();
        const c = clientSnap.data() || {};
        const validityDays = coercePositiveNumber(data.validityDays) ?? undefined;
        const fallbackValidity = validityDays ?? 30;
        const expiresAtIso =
          data.expiresAt?.toDate?.().toISOString() ||
          (data.purchasedAt
            ? new Date(data.purchasedAt.toDate().getTime() + fallbackValidity * DAY_MS).toISOString()
            : undefined);

        return {
          id: d.id,
          clientId: data.clientId,
          planSize: data.planSize,
          purchasedAt: data.purchasedAt?.toDate?.().toISOString(),
          remaining: Math.max(0, (Number(data.planSize) || 0) - (Number(data.used) || 0)),
          type: data.planSize === 1 ? 'single' : 'subscription',
          lastVisit: data.lastRedeemTs?.toDate?.().toISOString(),
          validityDays,
          expiresAt: expiresAtIso,
          client: {
            id: data.clientId,
            parentName: c.parentName,
            childName: c.childName,
            phone: c.phone,
            telegram: c.telegram,
            instagram: c.instagram,
            active: c.active,
            createdAt: c.createdAt?.toDate?.().toISOString(),
            updatedAt: c.updatedAt?.toDate?.().toISOString(),
          },
        };
      })
    );
    let nextPageToken: string | undefined;
    if (!clientId && docs.length > pageSize) {
      nextPageToken = docs[pageSize].id;
    }
    return { items, nextPageToken };
  });

  app.post('/passes', { preHandler: requireAdmin }, async req => {
    const bodySchema = z.object({
      clientId: z.string(),
      planSize: z.coerce.number().min(1),
      purchasedAt: z.string().datetime(),
      priceRSD: z.coerce.number().optional(),
      validityDays: z.coerce.number().min(1).max(365).optional(),
    });
    const body = bodySchema.parse(req.body);

    const existing = await db
      .collection('passes')
      .where('clientId', '==', body.clientId)
      .where('revoked', '==', false)
      .get();

    const now = new Date();
    const conflicting = existing.docs.find(doc => {
      const data = doc.data() as any;
      const planSize = Number.isFinite(data?.planSize) ? Number(data.planSize) : 0;
      const used = Number.isFinite(data?.used) ? Number(data.used) : 0;
      const remaining = Math.max(0, planSize - used);
      if (remaining <= 0) return false;

      const expiresAt: Date | undefined = data?.expiresAt?.toDate?.();
      if (expiresAt) {
        return expiresAt.getTime() > now.getTime();
      }

      const purchasedAt: Date | undefined = data?.purchasedAt?.toDate?.();
      if (!purchasedAt) {
        return true;
      }

      const validity = coercePositiveNumber(data?.validityDays) ?? 30;
      const fallbackExpiry = new Date(purchasedAt.getTime() + validity * DAY_MS);
      return fallbackExpiry.getTime() > now.getTime();
    });

    if (conflicting) {
      return { status: 'exists', conflictPassId: conflicting.id };
    }

    const settingsSnap = await db.collection('settings').doc('global').get();
    const settings = settingsSnap.data() as any | undefined;

    let validityDays = coercePositiveNumber(body.validityDays);
    if (settings?.passes && Array.isArray(settings.passes)) {
      const configuredPass = settings.passes.find((p: any) => {
        const sessions = coercePositiveNumber(p?.sessions ?? p?.planSize);
        return sessions === body.planSize;
      });
      const configValidity = coercePositiveNumber(configuredPass?.validityDays);
      if (configValidity) {
        validityDays = configValidity;
      }
    }

    const appliedValidityDays = validityDays ?? 30;

    const purchasedAt = Timestamp.fromDate(new Date(body.purchasedAt));
    const expiresAt = Timestamp.fromDate(
      new Date(purchasedAt.toDate().getTime() + appliedValidityDays * DAY_MS),
    );

    await db.runTransaction(async tx => {
      const passRef = db.collection('passes').doc();
      tx.set(passRef, {
        clientId: body.clientId,
        planSize: body.planSize,
        used: 0,
        purchasedAt,
        expiresAt,
        revoked: false,
        validityDays: appliedValidityDays,
        createdAt: FieldValue.serverTimestamp(),
      });
      const revRef = db.collection('redeems').doc();
      tx.set(revRef, {
        ts: FieldValue.serverTimestamp(),
        passId: passRef.id,
        clientId: body.clientId,
        delta: body.planSize,
        kind: 'purchase',
        priceRSD: body.priceRSD ?? 0,
      });
    });

    return { status: 'created' };
  });

  app.post<{ Params: { id: string } }>(
    '/passes/:id/convert-last',
    { preHandler: requireAdmin },
    async req => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const passRef = db.collection('passes').doc(id);
      await db.runTransaction(async tx => {
        const passSnap = await tx.get(passRef);
        if (!passSnap.exists) {
          const err: any = new Error('Not Found');
          err.statusCode = 404;
          throw err;
        }
        const pass = passSnap.data() as any;
        
        // Check if pass has remaining sessions
        const remaining = pass.planSize - pass.used;
        if (remaining <= 0) {
          const err: any = new Error('No remaining sessions in pass');
          err.statusCode = 400;
          throw err;
        }
        
        const dropinSnap = await tx.get(
          db
            .collection('redeems')
            .where('clientId', '==', pass.clientId)
            .where('kind', '==', 'dropin')
            .orderBy('ts', 'desc')
            .limit(1),
        );
        const dropinDoc = dropinSnap.docs[0];
        if (!dropinDoc) {
          const err: any = new Error('No recent drop-in visit found to convert');
          err.statusCode = 404;
          throw err;
        }
        
        // Check if drop-in is recent (within last 24 hours)
        const dropinTime = dropinDoc.get('ts')?.toDate();
        const now = new Date();
        const hoursDiff = (now.getTime() - dropinTime.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          const err: any = new Error('Drop-in visit is too old to convert (must be within 24 hours)');
          err.statusCode = 400;
          throw err;
        }
        
        tx.update(passRef, {
          used: FieldValue.increment(1),
          lastRedeemTs: dropinDoc.get('ts'),
        });
        tx.update(dropinDoc.ref, {
          kind: 'pass',
          passId: passRef.id,
          delta: -1,
          priceRSD: FieldValue.delete(),
        });
      });
      return { status: 'ok' };
    },
  );

  app.post<{ Params: { id: string }; Body: { count: number } }>(
    '/passes/:id/deduct',
    { preHandler: requireAdmin },
    async req => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { count } = z
        .object({ count: z.coerce.number().min(1).max(50) })
        .parse(req.body);
      const passRef = db.collection('passes').doc(id);
      await db.runTransaction(async tx => {
        const passSnap = await tx.get(passRef);
        if (!passSnap.exists) {
          const err: any = new Error('Not Found');
          err.statusCode = 404;
          throw err;
        }
        const pass = passSnap.data() as any;
        const remaining = pass.planSize - pass.used;
        if (count > remaining) {
          const err: any = new Error(`Cannot deduct ${count} sessions, only ${remaining} remaining`);
          err.statusCode = 400;
          throw err;
        }

        if (pass.revoked) {
          const err: any = new Error('Cannot deduct from revoked pass');
          err.statusCode = 400;
          throw err;
        }

        const now = Timestamp.now();
        tx.update(passRef, {
          used: FieldValue.increment(count),
          lastRedeemTs: now,
        });
        const redeemRef = db.collection('redeems').doc();
        tx.set(redeemRef, {
          ts: now,
          passId: passRef.id,
          clientId: pass.clientId,
          delta: -count,
          kind: 'manual',
          note: `Manual deduction of ${count} session${count > 1 ? 's' : ''}`,
        });
      });
      return { status: 'ok' };
    },
  );

  app.post<{ Params: { id: string }; Body: { count: number } }>(
    '/passes/:id/restore',
    { preHandler: requireAdmin },
    async req => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { count } = z
        .object({ count: z.coerce.number().min(1).max(50) })
        .parse(req.body);
      const passRef = db.collection('passes').doc(id);
      await db.runTransaction(async tx => {
        const passSnap = await tx.get(passRef);
        if (!passSnap.exists) {
          const err: any = new Error('Not Found');
          err.statusCode = 404;
          throw err;
        }
        const pass = passSnap.data() as any;
        const used = typeof pass.used === 'number' ? pass.used : 0;
        if (count > used) {
          const err: any = new Error(`Cannot restore ${count} sessions, only ${used} used`);
          err.statusCode = 400;
          throw err;
        }

        if (pass.revoked) {
          const err: any = new Error('Cannot restore to revoked pass');
          err.statusCode = 400;
          throw err;
        }

        tx.update(passRef, {
          used: FieldValue.increment(-count),
        });
        const redeemRef = db.collection('redeems').doc();
        const now = Timestamp.now();
        tx.set(redeemRef, {
          ts: now,
          passId: passRef.id,
          clientId: pass.clientId,
          delta: count,
          kind: 'manual',
          note: `Manual restoration of ${count} session${count > 1 ? 's' : ''}`,
        });
      });
      return { status: 'ok' };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/passes/:id',
    { preHandler: requireAdmin },
    async req => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const passRef = db.collection('passes').doc(id);
      const passSnap = await passRef.get();
      if (!passSnap.exists) {
        const err: any = new Error('Not Found');
        err.statusCode = 404;
        throw err;
      }
      const pass = passSnap.data() as any;
      await db.runTransaction(async tx => {
        tx.delete(passRef);
        const revRef = db.collection('redeems').doc();
        tx.set(revRef, {
          ts: FieldValue.serverTimestamp(),
          passId: passRef.id,
          clientId: pass.clientId,
          delta: 0,
          kind: 'revoke',
        });
      });
      return { status: 'ok' };
    },
  );
}
