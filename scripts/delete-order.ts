import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orderNumber = process.argv[2]?.trim();
  if (!orderNumber) {
    throw new Error("Usage: bun scripts/delete-order.ts <ORDER_NUMBER>");
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      status: true,
      quotationNumber: true,
      invoiceNumber: true,
      creditNoteNumber: true,
    },
  });

  if (!order) {
    console.log(JSON.stringify({ orderNumber, found: false }, null, 2));
    return;
  }

  const paymentWhere = [];
  if (order.invoiceNumber) {
    paymentWhere.push({ invoiceNumber: order.invoiceNumber });
  }
  if (order.quotationNumber) {
    paymentWhere.push({ preInvoiceNumber: order.quotationNumber });
  }
  if (order.creditNoteNumber) {
    paymentWhere.push({ creditNoteNumber: order.creditNoteNumber });
  }

  const linkedPayments = paymentWhere.length > 0
    ? await prisma.payment.findMany({
      where: { OR: paymentWhere },
      select: { id: true },
    })
    : [];

  const paymentIds = linkedPayments.map((payment) => payment.id);

  const deleted = await prisma.$transaction(async (tx) => {
    const paymentHistory = paymentIds.length > 0
      ? await tx.paymentHistory.deleteMany({
        where: { paymentId: { in: paymentIds } },
      })
      : { count: 0 };

    const payments = paymentIds.length > 0
      ? await tx.payment.deleteMany({
        where: { id: { in: paymentIds } },
      })
      : { count: 0 };

    const orderDocuments = await tx.orderDocument.deleteMany({
      where: { orderId: order.id },
    });

    const orderSlips = await tx.orderSlip.deleteMany({
      where: { orderId: order.id },
    });

    const orderHistory = await tx.orderHistory.deleteMany({
      where: { orderId: order.id },
    });

    const orders = await tx.order.deleteMany({
      where: { id: order.id },
    });

    return {
      paymentHistory: paymentHistory.count,
      payments: payments.count,
      orderDocuments: orderDocuments.count,
      orderSlips: orderSlips.count,
      orderHistory: orderHistory.count,
      orders: orders.count,
    };
  });

  const remaining = {
    orders: await prisma.order.count({ where: { orderNumber } }),
    orderDocuments: await prisma.orderDocument.count({ where: { orderId: order.id } }),
    orderSlips: await prisma.orderSlip.count({ where: { orderId: order.id } }),
    orderHistory: await prisma.orderHistory.count({ where: { orderId: order.id } }),
    payments: paymentIds.length > 0
      ? await prisma.payment.count({ where: { id: { in: paymentIds } } })
      : 0,
  };

  console.log(JSON.stringify({
    found: true,
    order,
    linkedPaymentIds: paymentIds,
    deleted,
    remaining,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
