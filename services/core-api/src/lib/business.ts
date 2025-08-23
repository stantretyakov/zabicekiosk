import { FieldValue, Timestamp } from '@google-cloud/firestore';
import { getDb } from './firestore.js';
import { hashToken } from './tokens.js';
import type { RedeemRequest, RedeemResponse } from '../../types/api.d.js';

/**
 * Core redeem logic executed within a Firestore transaction. It implements
 * simple subset of business rules from the specification:
 *  - lookup pass by token hash or client id
 *  - check expiration and cooldown
 *  - increment usage or register drop-in with price from settings
 */
export async function redeem(
  req: RedeemRequest & { eventId: string; ip?: string }
): Promise<RedeemResponse> {
  const db = getDb();

  let clientRef: FirebaseFirestore.DocumentReference | null = null;
  if (req.clientId) {
    clientRef = db.collection('clients').doc(req.clientId);
  } else if (req.token) {
    const tokenHash = hashToken(req.token);
    const clientSnap = await db
      .collection('clients')
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();
    if (clientSnap.empty) {
      return { status: 'error', code: 'INVALID_TOKEN', message: 'Invalid token' };
    }
    clientRef = clientSnap.docs[0].ref;
  } else {
    return { status: 'error', code: 'INVALID_REQUEST', message: 'Missing client identifier' };
  }

  const passQuery = db
    .collection('passes')
    .where('clientId', '==', clientRef.id)
    .where('revoked', '==', false)
    .orderBy('purchasedAt', 'desc');

  let passRef: FirebaseFirestore.DocumentReference | null = null;
  const settingsRef = db.doc('settings/global');

  return db.runTransaction<RedeemResponse>(async tx => {
    const settingsDoc = await tx.get(settingsRef);
    const now = Timestamp.now();

    const passSnap = await tx.get(passQuery);
    let passDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    for (const doc of passSnap.docs) {
      const data = doc.data() as any;
      const remaining = data.planSize - data.used;
      if (data.expiresAt.toDate() > now.toDate() && remaining > 0) {
        passDoc = doc;
        passRef = doc.ref;
        break;
      }
    }

    const settings = settingsDoc.data() as any;

    const pass = passDoc?.data() as any | undefined;

    if (pass && passRef) {
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

      const cooldownSec = settings?.cooldownSec ?? 5;
      if (
        pass.lastRedeemTs &&
        now.seconds - pass.lastRedeemTs.seconds < cooldownSec
      ) {
        return { status: 'error', code: 'COOLDOWN', message: 'Try later' };
      }

      const daySec = 24 * 60 * 60;
      if (
        pass.lastRedeemTs &&
        now.seconds - pass.lastRedeemTs.seconds < daySec
      ) {
        return {
          status: 'error',
          code: 'DUPLICATE',
          message: 'Занятие уже учтено',
        };
      }

      const remaining = pass.planSize - pass.used;
      if (pass.expiresAt.toDate() > now.toDate() && remaining > 0) {
        const redeemRef = db.collection('redeems').doc();
        tx.update(passRef!, {
          used: FieldValue.increment(1),
          lastRedeemTs: now,
          lastEventId: req.eventId,
        });
        tx.set(redeemRef, {
          ts: now,
          passId: passRef!.id,
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
    }

    const redeemRef = db.collection('redeems').doc();
    const priceRSD = settings?.prices?.dropInRSD ?? 0;
    tx.set(redeemRef, {
      ts: now,
      clientId: clientRef.id,
      kind: 'dropin',
      priceRSD,
      kioskId: req.kioskId,
      eventId: req.eventId,
      ip: req.ip,
    });
    if (passRef) {
      tx.update(passRef, { lastRedeemTs: now, lastEventId: req.eventId });
    }
    return {
      status: 'ok',
      type: 'single',
      message: 'Разовое занятие',
    };
  });
}
