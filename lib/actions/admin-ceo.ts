
import { prisma as db } from "../db";

// ── Helpers ─────────────────────────────────────────────

function monthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return monthStart(d);
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── 1. getCEOMetrics ────────────────────────────────────

export async function getCEOMetrics() {
  const now = new Date();
  const thisMonthStart = monthStart(now);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = monthStart(lastMonthDate);
  const lastMonthEnd = monthEnd(lastMonthDate);

  const [revenueThisMonth, revenueLastMonth] = await Promise.all([
    db.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const mrr = revenueThisMonth._sum.amount ?? 0;
  const arr = mrr * 12;
  const mtdRevenue = mrr;
  const lastMonthRevenue = revenueLastMonth._sum.amount ?? 0;
  const nrr = lastMonthRevenue > 0 ? (mrr / lastMonthRevenue) * 100 : 0;

  return { mrr, arr, mtdRevenue, nrr: Math.round(nrr * 100) / 100 };
}

// ── 2. getRevenueTrend ──────────────────────────────────

export async function getRevenueTrend(months = 12) {
  const start = monthsAgo(months);

  const transactions = await db.transaction.findMany({
    where: { status: "completed", createdAt: { gte: start } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets: Record<string, number> = {};

  // Pre-fill all months
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    buckets[formatMonth(d)] = 0;
  }

  for (const tx of transactions) {
    const key = formatMonth(tx.createdAt);
    if (key in buckets) {
      buckets[key] += tx.amount;
    }
  }

  return Object.entries(buckets).map(([month, revenue]) => ({ month, revenue }));
}

// ── 3. getUserGrowth ────────────────────────────────────

export async function getUserGrowth(months = 12) {
  const start = monthsAgo(months);

  // Single query: count new users per month using DATE_TRUNC
  const rows = await db.$queryRaw<
    { month: Date; new_users: bigint }[]
  >`
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS new_users
    FROM users
    WHERE created_at >= ${start}
    GROUP BY month
    ORDER BY month
  `;

  // Build a map of new users per month from the query result
  const newUsersMap = new Map<string, number>();
  for (const row of rows) {
    const key = formatMonth(new Date(row.month));
    newUsersMap.set(key, Number(row.new_users));
  }

  // Get total user count before the start period (baseline)
  const baselineCount = await db.user.count({
    where: { createdAt: { lt: start } },
  });

  // Build result with cumulative totals
  const result: { month: string; total: number; newUsers: number }[] = [];
  let cumulative = baselineCount;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = formatMonth(d);
    const newUsers = newUsersMap.get(key) ?? 0;
    cumulative += newUsers;
    result.push({ month: key, total: cumulative, newUsers });
  }

  return result;
}

// ── 4. getChurnData ─────────────────────────────────────

export async function getChurnData(months = 6) {
  const result: { month: string; churnRate: number; churned: number; active: number }[] = [];
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mEnd = monthEnd(d);
    const churnCutoff = new Date(mEnd.getTime() - thirtyDaysMs);

    const [totalUsers, activeUsers] = await Promise.all([
      db.user.count({ where: { createdAt: { lte: mEnd } } }),
      db.user.count({
        where: {
          createdAt: { lte: mEnd },
          updatedAt: { gte: churnCutoff },
        },
      }),
    ]);

    const churned = totalUsers - activeUsers;
    const churnRate = totalUsers > 0 ? (churned / totalUsers) * 100 : 0;

    result.push({
      month: formatMonth(d),
      churnRate: Math.round(churnRate * 100) / 100,
      churned,
      active: activeUsers,
    });
  }

  return result;
}

// ── 5. getARPU ──────────────────────────────────────────

export async function getARPU() {
  const now = new Date();
  const thisMonthStart = monthStart(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [revenue, activeUsers] = await Promise.all([
    db.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;
  const arpu = activeUsers > 0 ? totalRevenue / activeUsers : 0;

  return {
    arpu: Math.round(arpu * 100) / 100,
    totalRevenue,
    activeUsers,
  };
}

// ── 6. getLTV ────────────────────────────────────────────

export async function getLTV() {
  const now = new Date();
  const thisMonthStart = monthStart(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [revenue, activeUsers, firstUser] = await Promise.all([
    db.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    db.user.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;
  const arpu = activeUsers > 0 ? totalRevenue / activeUsers : 0;

  // Average customer lifespan in months
  let avgLifespanMonths = 1;
  if (firstUser) {
    const diffMs = now.getTime() - firstUser.createdAt.getTime();
    avgLifespanMonths = Math.max(1, diffMs / (30 * 24 * 60 * 60 * 1000));
  }

  const ltv = arpu * avgLifespanMonths;

  return {
    ltv: Math.round(ltv * 100) / 100,
    arpu: Math.round(arpu * 100) / 100,
    avgLifespanMonths: Math.round(avgLifespanMonths * 10) / 10,
  };
}

// ── 7. getTopCustomers ──────────────────────────────────

export async function getTopCustomers(limit = 10) {
  const customers = await db.transaction.groupBy({
    by: ["userId"],
    where: { status: "completed" },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const userIds = customers.map((c) => c.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return customers.map((c) => ({
    userId: c.userId,
    name: userMap.get(c.userId)?.name ?? "Unknown",
    email: userMap.get(c.userId)?.email ?? "",
    totalRevenue: c._sum.amount ?? 0,
    transactionCount: c._count,
  }));
}

// ── 8. getRecentSignups ─────────────────────────────────

export async function getRecentSignups(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const users = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get first message or transaction for each user
  const userIds = users.map((u) => u.id);

  const [firstMessages, firstTransactions] = await Promise.all([
    db.message.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "asc" },
      distinct: ["userId"],
      select: { userId: true, createdAt: true, content: true },
    }),
    db.transaction.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "asc" },
      distinct: ["userId"],
      select: { userId: true, createdAt: true, amount: true },
    }),
  ]);

  const msgMap = new Map(firstMessages.map((m) => [m.userId, m]));
  const txMap = new Map(firstTransactions.map((t) => [t.userId, t]));

  return users.map((u) => {
    const firstMsg = msgMap.get(u.id);
    const firstTx = txMap.get(u.id);

    let firstAction: { type: string; date: Date } | null = null;
    if (firstMsg && firstTx) {
      firstAction =
        firstMsg.createdAt < firstTx.createdAt
          ? { type: "message", date: firstMsg.createdAt }
          : { type: "transaction", date: firstTx.createdAt };
    } else if (firstMsg) {
      firstAction = { type: "message", date: firstMsg.createdAt };
    } else if (firstTx) {
      firstAction = { type: "transaction", date: firstTx.createdAt };
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      firstAction,
    };
  });
}

// ── 9. getChurnedUsers ──────────────────────────────────

export async function getChurnedUsers(limit = 20) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const users = await db.user.findMany({
    where: {
      updatedAt: { lt: thirtyDaysAgo },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    lastActivity: u.updatedAt,
    daysSinceActive: Math.floor(
      (Date.now() - u.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

// ── 10. getRevenueByPlan ────────────────────────────────

export async function getRevenueByPlan() {
  const now = new Date();
  const thisMonthStart = monthStart(now);

  // Group by method (payment method as proxy for plan type)
  const byMethod = await db.transaction.groupBy({
    by: ["method"],
    where: { status: "completed", createdAt: { gte: thisMonthStart } },
    _sum: { amount: true },
    _count: true,
  });

  // Get package purchase breakdown
  const byPackageTier = await db.packagePurchase.groupBy({
    by: ["tierId"],
    where: { createdAt: { gte: thisMonthStart } },
    _count: true,
    _sum: { smsTotal: true },
  });

  return {
    byMethod: byMethod.map((m) => ({
      method: m.method,
      revenue: m._sum.amount ?? 0,
      count: m._count,
    })),
    byPackageTier: byPackageTier.map((p) => ({
      tierId: p.tierId,
      totalSms: p._sum.smsTotal ?? 0,
      count: p._count,
    })),
  };
}
