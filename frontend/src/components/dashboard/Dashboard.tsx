import { useState } from "react";
import {
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  MoreVertical,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("monthly");

  // Sales data for chart
  const salesData = {
    monthly: [65, 78, 60, 89, 76, 85, 70, 92, 80, 95, 85, 90],
    weekly: [30, 45, 35, 55, 40, 60, 50, 65],
    daily: [10, 15, 12, 18, 20, 25, 22, 28, 24, 30],
  };

  // Top products data
  const topProducts = [
    {
      id: 1,
      name: "Premium Headphones",
      category: "Electronics",
      sales: 342,
      revenue: 12540,
      stock: 45,
    },
    {
      id: 2,
      name: "Wireless Mouse",
      category: "Electronics",
      sales: 289,
      revenue: 8670,
      stock: 78,
    },
    {
      id: 3,
      name: "Organic Cotton T-Shirt",
      category: "Fashion",
      sales: 256,
      revenue: 7680,
      stock: 120,
    },
    {
      id: 4,
      name: "Smart Watch Series 5",
      category: "Electronics",
      sales: 198,
      revenue: 29700,
      stock: 32,
    },
    {
      id: 5,
      name: "Yoga Mat Premium",
      category: "Fitness",
      sales: 187,
      revenue: 5610,
      stock: 67,
    },
  ];

  // Recent orders data
  const recentOrders = [
    {
      id: "#ORD-7841",
      customer: "John Smith",
      date: "2023-10-15",
      amount: 249.99,
      status: "completed",
    },
    {
      id: "#ORD-7842",
      customer: "Sarah Johnson",
      date: "2023-10-14",
      amount: 129.5,
      status: "pending",
    },
    {
      id: "#ORD-7843",
      customer: "Michael Chen",
      date: "2023-10-14",
      amount: 89.99,
      status: "completed",
    },
    {
      id: "#ORD-7844",
      customer: "Emma Wilson",
      date: "2023-10-13",
      amount: 459.75,
      status: "processing",
    },
    {
      id: "#ORD-7845",
      customer: "David Brown",
      date: "2023-10-13",
      amount: 199.99,
      status: "completed",
    },
  ];

  // Stats cards data
  const statsCards = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+12.5%",
      isPositive: true,
      icon: <DollarSign className="h-5 w-5" />,
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Total Orders",
      value: "2,845",
      change: "+8.2%",
      isPositive: true,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active Customers",
      value: "1,254",
      change: "-3.1%",
      isPositive: false,
      icon: <Users className="h-5 w-5" />,
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Products Sold",
      value: "12,543",
      change: "+5.7%",
      isPositive: true,
      icon: <Package className="h-5 w-5" />,
      color: "bg-orange-50 text-[#ff6d29]",
    },
  ];

  return (
    <div className="">
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Home</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#ff6d29]">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#26272F]">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back! Here's what's happening with your store today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="input-style py-2 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DBDFE9] rounded-md text-sm hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-md text-sm hover:bg-[#e65a1f]">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              <div
                className={`flex items-center gap-1 text-sm ${card.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                {card.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {card.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#26272F] mb-1">
              {card.value}
            </h3>
            <p className="text-gray-500 text-sm">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#26272F]">
              Sales Overview
            </h3>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-md ${timeRange === "daily" ? "bg-[#ffe8d2] text-[#ff6d29]" : "text-gray-500 hover:bg-gray-50"}`}
                onClick={() => setTimeRange("daily")}
              >
                Day
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md ${timeRange === "weekly" ? "bg-[#ffe8d2] text-[#ff6d29]" : "text-gray-500 hover:bg-gray-50"}`}
                onClick={() => setTimeRange("weekly")}
              >
                Week
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md ${timeRange === "monthly" ? "bg-[#ffe8d2] text-[#ff6d29]" : "text-gray-500 hover:bg-gray-50"}`}
                onClick={() => setTimeRange("monthly")}
              >
                Month
              </button>
            </div>
          </div>

          <div className="h-64">
            <div className="flex items-end h-48 gap-1 mt-4">
              {salesData[timeRange].map((value, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div
                    className="w-full bg-gradient-to-t from-[#ff6d29] to-[#ff8d57] rounded-t-md transition-all duration-300 hover:from-[#e65a1f] hover:to-[#ff6d29] cursor-pointer"
                    style={{ height: `${value}%` }}
                    title={`${value}%`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">
                    {timeRange === "monthly"
                      ? [
                          "J",
                          "F",
                          "M",
                          "A",
                          "M",
                          "J",
                          "J",
                          "A",
                          "S",
                          "O",
                          "N",
                          "D",
                        ][index]
                      : timeRange === "weekly"
                        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                            index
                          ]
                        : `${index + 8}:00`}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#ff6d29]"></div>
                <span className="text-sm text-gray-600">Sales</span>
              </div>
              <div className="text-sm text-gray-500">
                Total:{" "}
                {timeRange === "monthly"
                  ? "$45,231"
                  : timeRange === "weekly"
                    ? "$8,542"
                    : "$2,150"}
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#26272F]">
              Top Selling Products
            </h3>
            <button className="text-sm text-[#ff6d29] hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md bg-[#ffe8d2] flex items-center justify-center">
                    <Package className="h-6 w-6 text-[#ff6d29]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#26272F]">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {product.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                        #{product.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-[#26272F]">
                      ${product.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.sales} units
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-full font-medium ${product.stock > 50 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {product.stock} in stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="table-root mb-6">
        <div className="flex items-center justify-between p-4 border-b border-[#DBDFE9]">
          <h3 className="table-title">Recent Orders</h3>
          <button className="text-sm text-[#ff6d29] hover:underline flex items-center gap-1">
            View All Orders <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="main-table">
            <thead className="table-heder">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="font-medium">{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td className="font-semibold">${order.amount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-[#26272F]">Conversion Rate</h4>
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +2.4%
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-[#26272F]">4.8%</p>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#ff6d29] rounded-full"
                style={{ width: "48%" }}
              ></div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Avg. order value: $89.42</p>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-[#26272F]">Returning Customers</h4>
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +12.7%
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-[#26272F]">34.2%</p>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: "34%" }}
              ></div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Customer retention rate</p>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-[#26272F]">Inventory Alert</h4>
            <span className="text-red-600 text-sm font-medium flex items-center gap-1">
              <TrendingDown className="h-4 w-4" /> -8.2%
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-[#26272F]">12 items</p>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Low stock products</p>
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#ffe8d2] to-white border border-[#DBDFE9] rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-[#26272F]">
              Need help with your dashboard?
            </h4>
            <p className="text-gray-600 text-sm">
              Check our documentation or contact support
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-[#DBDFE9] rounded-md text-sm hover:bg-gray-50">
              View Docs
            </button>
            <button className="px-4 py-2 bg-[#ff6d29] text-white rounded-md text-sm hover:bg-[#e65a1f]">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
