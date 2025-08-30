import { FastifyInstance } from 'fastify';
import { getDb } from '../lib/firestore.js';
import { requireAdmin } from '../lib/auth.js';
import { Timestamp } from '@google-cloud/firestore';

export default async function adminStats(app: FastifyInstance) {
  const db = getDb();

  app.get('/stats', { preHandler: requireAdmin }, async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const clientsSnap = await db.collection('clients').get();
    const totalClients = clientsSnap.size;
    const activeClients = clientsSnap.docs.filter(d => (d.data() as any).active).length;
    const clientRetention = totalClients ? (activeClients / totalClients) * 100 : 0;

    const passesSnap = await db.collection('passes').where('revoked', '==', false).get();
    const activePassDocs = passesSnap.docs.filter(d => {
      const data = d.data() as any;
      const remaining = data.planSize - data.used;
      const expiresAt = data.expiresAt?.toDate?.();
      return remaining > 0 && expiresAt && expiresAt > now;
    });
    const activePasses = activePassDocs.length;

    const passTypeCounts: Record<string, number> = {};
    const upcomingExpirations = { next7Days: 0, next14Days: 0, next30Days: 0 };
    for (const doc of activePassDocs) {
      const data = doc.data() as any;
      const planSize = data.planSize;
      const label = planSize === 1 ? 'Single' : `${planSize}-Session`;
      passTypeCounts[label] = (passTypeCounts[label] || 0) + 1;
      const expiresAt = data.expiresAt?.toDate?.();
      if (expiresAt) {
        const diff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 7) upcomingExpirations.next7Days++;
        if (diff <= 14) upcomingExpirations.next14Days++;
        if (diff <= 30) upcomingExpirations.next30Days++;
      }
    }
    const passTypeDistribution = Object.entries(passTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: activePasses ? Math.round((count / activePasses) * 1000) / 10 : 0,
    }));

    const redeemsSnap = await db
      .collection('redeems')
      .where('ts', '>=', Timestamp.fromDate(startOfLastMonth))
      .get();

    let redeems7d = 0;
    let dropInRevenue = 0;
    let passRevenue = 0;
    const redeemsByDayMap: Record<string, number> = {};
    let visitsThisMonth = 0;
    let visitsLastMonth = 0;
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    for (const doc of redeemsSnap.docs) {
      const data = doc.data() as any;
      const ts: Date | undefined = data.ts?.toDate?.();
      if (!ts) continue;
      const key = ts.toISOString().slice(0, 10);
      if (data.kind === 'pass' || data.kind === 'dropin') {
        if (ts >= sevenDaysAgo) {
          redeems7d++;
          redeemsByDayMap[key] = (redeemsByDayMap[key] || 0) + 1;
        }
        if (ts >= startOfMonth) {
          visitsThisMonth++;
        } else if (ts >= startOfLastMonth && ts <= endOfLastMonth) {
          visitsLastMonth++;
        }
      }
      if (data.kind === 'dropin' && data.priceRSD && ts >= startOfMonth) {
        dropInRevenue += data.priceRSD;
      }
      if (data.kind === 'purchase' && data.priceRSD && ts >= startOfMonth) {
        passRevenue += data.priceRSD;
      }
    }

    const redeemsByDay = Object.keys(redeemsByDayMap)
      .sort()
      .map(date => ({ date, count: redeemsByDayMap[date] }));

    const visitStats = {
      thisMonth: visitsThisMonth,
      lastMonth: visitsLastMonth,
      growth: visitsLastMonth
        ? ((visitsThisMonth - visitsLastMonth) / visitsLastMonth) * 100
        : 0,
    };

    const revenueBreakdown = {
      passes: passRevenue,
      dropIns: dropInRevenue,
      total: passRevenue + dropInRevenue,
    };

    const expiring14d = upcomingExpirations.next14Days;
    const mrr = revenueBreakdown.total;
    const grr = revenueBreakdown.total;

    const recentSnap = await db
      .collection('redeems')
      .orderBy('ts', 'desc')
      .limit(5)
      .get();
    const recentRedeems = await Promise.all(
      recentSnap.docs.map(async d => {
        const data = d.data() as any;
        let client: any;
        if (data.clientId) {
          const cSnap = await db.collection('clients').doc(data.clientId).get();
          const c = cSnap.data();
          if (c) {
            client = {
              id: data.clientId,
              parentName: c.parentName,
              childName: c.childName,
              phone: c.phone,
              telegram: c.telegram,
              instagram: c.instagram,
              active: c.active,
              createdAt: c.createdAt?.toDate?.().toISOString(),
              updatedAt: c.updatedAt?.toDate?.().toISOString(),
            };
          }
        }
        return {
          id: d.id,
          ts: data.ts?.toDate?.().toISOString(),
          kind: data.kind,
          clientId: data.clientId,
          delta: data.delta,
          priceRSD: data.priceRSD,
          client,
        };
      })
    );

    return {
      activePasses,
      redeems7d,
      dropInRevenue,
      expiring14d,
      redeemsByDay,
      recentRedeems,
      totalClients,
      activeClients,
      clientRetention: Number(clientRetention.toFixed(1)),
      mrr,
      grr,
      visitStats,
      revenueBreakdown,
      passTypeDistribution,
      upcomingExpirations,
    };
  });
}

