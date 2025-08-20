import { FieldValue, Timestamp } from '@google-cloud/firestore';
import { getDb } from './firestore.js';
import { hashToken } from './tokens.js';
import type { RedeemRequest, RedeemResponse } from '../../types/api.d.js';

/**
 * Core redeem logic executed within a Firestore transaction. It implements
 * simple subset of business rules from the specification:
 *  - lookup pass by token hash
 *  - check expiration and cooldown
 *  - increment usage or register drop-in with price from settings
 */
export async function redeem(
  req: RedeemRequest & { eventId: string; ip?: string }
): Promise<RedeemResponse> {
  const db = getDb();
  const tokenHash = hashToken(req.token);
  const passSnap = await db
    .collection('passes')
    .where('tokenHash', '==', tokenHash)
    .where('revoked', '==', false)
    .limit(1)
    .get();

  if (passSnap.empty) {
    return { status: 'error', code: 'INVALID_TOKEN', message: 'Invalid token' };
  }

  const passRef = passSnap.docs[0].ref;
  const settingsRef = db.doc('settings/global');

  return db.runTransaction<RedeemResponse>(async tx => {
    const [passDoc, settingsDoc] = await Promise.all([
      tx.get(passRef),
      tx.get(settingsRef),
    ]);

    const pass = passDoc.data() as any;
    const settings = settingsDoc.data() as any;
    const now = Timestamp.now();

    // Idempotency check
    if (pass.lastEventId === req.eventId) {
      const remaining = pass.planSize - pass.used;
      return {
        status: 'ok',
        type: 'pass',
        message: 'already redeemed',
        remaining,
        planSize: pass.planSize,
        expiresAt: pass.expiresAt.toDate().toISOString(),
      };
    }

    if (pass.expiresAt.toDate() < now.toDate()) {
      return { status: 'error', code: 'EXPIRED', message: 'Pass expired' };
    }

    const cooldownSec = settings?.cooldownSec ?? 0;
    if (
      pass.lastRedeemTs &&
      now.seconds - pass.lastRedeemTs.seconds < cooldownSec
    ) {
      return { status: 'error', code: 'COOLDOWN', message: 'Try later' };
    }

    const remaining = pass.planSize - pass.used;
    const redeemRef = db.collection('redeems').doc();

    if (remaining > 0) {
      tx.update(passRef, {
        used: FieldValue.increment(1),
        lastRedeemTs: now,
        lastEventId: req.eventId,
      });
      tx.set(redeemRef, {
        ts: now,
        passId: passRef.id,
        clientId: pass.clientId,
        delta: -1,
        kind: 'pass',
        kioskId: req.kioskId,
        eventId: req.eventId,
        ip: req.ip,
      });
      return {
        status: 'ok',
        type: 'pass',
        message: 'redeemed',
        remaining: remaining - 1,
        planSize: pass.planSize,
        expiresAt: pass.expiresAt.toDate().toISOString(),
      };
    }

    const priceRSD = settings?.prices?.dropInRSD ?? 0;
    tx.set(redeemRef, {
      ts: now,
      clientId: pass.clientId,
      kind: 'dropin',
      priceRSD,
      kioskId: req.kioskId,
      eventId: req.eventId,
      ip: req.ip,
    });
    tx.update(passRef, { lastRedeemTs: now, lastEventId: req.eventId });
    return {
      status: 'ok',
      type: 'dropin',
      message: 'drop-in',
      priceRSD,
    };
  });
}
