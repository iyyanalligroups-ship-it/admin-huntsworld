import {
  PackageSearch,
  TrendingUp,
  Eye,
  Star,
  FileWarning,
  FileText,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSidebar } from '@/modules/admin/hooks/useSidebar'

const mockStats = [
  {
    title: "Total Products",
    icon: PackageSearch,
    count: 128,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Trending Points",
    icon: TrendingUp,
    count: 423,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    title: "View Points",
    icon: Eye,
    count: 980,
    color: "text-green-600",
    bg: "bg-green-100",
  },
];

const subscription = {
  plan_name: "Premium Plan",
  start_date: "2025-06-01",
  end_date: "2025-09-01",
  status: "Active",
  price: 999,
  duration: "3 Months",
};

const mockTrendingProducts = [
  { name: "T-Shirt", points: 1200 },
  { name: "Shoes", points: 1050 },
  { name: "Watch", points: 900 },
  { name: "Sunglasses", points: 740 },
  { name: "Bag", points: 500 },
];


const latestReviews = [
  { id: 1, user: "Amit", comment: "Great quality!", rating: 5 },
  { id: 2, user: "Priya", comment: "Fast shipping.", rating: 4 },
  { id: 3, user: "Ravi", comment: "Nice packaging.", rating: 4 },
  { id: 4, user: "Nikita", comment: "Affordable price.", rating: 5 },
  { id: 5, user: "Manish", comment: "Good experience.", rating: 4 },
];

const latestComplaints = [
  { id: 1, user: "Sohan", issue: "Product was damaged" },
  { id: 2, user: "Kajal", issue: "Wrong size delivered" },
  { id: 3, user: "Farhan", issue: "Late delivery" },
  { id: 4, user: "Deepa", issue: "Refund not received" },
  { id: 5, user: "Mohan", issue: "Item missing" },
];

const latestRequirements = [
  { id: 1, product: "T-shirt Bulk Order", qty: "500 pcs" },
  { id: 2, product: "Jeans Export", qty: "300 pcs" },
  { id: 3, product: "Shoes Retail", qty: "100 pcs" },
  { id: 4, product: "Jacket Inquiry", qty: "150 pcs" },
  { id: 5, product: "Bag Wholesale", qty: "200 pcs" },
];

const Dashboard=()=> {
    const { isSidebarOpen } = useSidebar()
  return (
 <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
     <div className="p-4 space-y-6">
      {/* 📥 Subscription Plan */}
      <motion.div
        className="grid grid-cols-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold mb-1">Current Plan: {subscription.plan_name}</h2>
                <p className="text-sm flex gap-2 items-center">
                  <CalendarDays className="h-4 w-4" /> {subscription.start_date} →{" "}
                  {subscription.end_date}
                </p>
                <p>Status: {subscription.status} | ₹{subscription.price} ({subscription.duration})</p>
              </div>
              <BadgeCheck className="w-10 h-10 text-green-300" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🔢 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mockStats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-xl shadow-sm border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-full ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <h3 className="text-xl font-bold">{item.count}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 📊 Trending Chart */}
      <motion.div
        className="rounded-xl  bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* <h2 className="font-semibold mb-2">Monthly Trending Products</h2> */}
        <Card className="shadow-xl rounded-2xl p-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <TrendingUp className="w-6 h-6 text-purple-600 animate-bounce" />
          Trending Products (This Month)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockTrendingProducts}>
            <XAxis dataKey="name" stroke="#8884d8" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="points"  barSize={60}  fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
      </motion.div>

      {/* Latest 5 Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reviews */}
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Latest Reviews</h3>
            </div>
            {latestReviews.map((r) => (
              <div key={r.id} className="text-sm border-b pb-1">
                <p className="font-medium">{r.user}</p>
                <p className="text-muted-foreground">{r.comment} (⭐ {r.rating})</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Complaints */}
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Latest Complaints</h3>
            </div>
            {latestComplaints.map((c) => (
              <div key={c.id} className="text-sm border-b pb-1">
                <p className="font-medium">{c.user}</p>
                <p className="text-muted-foreground">{c.issue}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Latest Requirements</h3>
            </div>
            {latestRequirements.map((r) => (
              <div key={r.id} className="text-sm border-b pb-1">
                <p className="font-medium">{r.product}</p>
                <p className="text-muted-foreground">Qty: {r.qty}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
 </div>
  );
}

export default Dashboard;
