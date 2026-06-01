import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import OrdersClient from "@/components/admin/orders/OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await dbConnect();

  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const serialized = orders.map((order: any) => ({
    ...order,
    _id: order._id.toString(),
    user: order.user ? { ...order.user, _id: order.user._id.toString() } : null,
    items: order.items.map((item: any) => ({ ...item, _id: item._id?.toString() })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
  }));

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {serialized.length} total order{serialized.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <OrdersClient orders={serialized} />
    </div>
  );
}
