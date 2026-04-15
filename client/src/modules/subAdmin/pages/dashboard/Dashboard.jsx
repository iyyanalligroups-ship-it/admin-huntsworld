import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, Briefcase, GraduationCap, Apple, AlertCircle, ShoppingCart, Shield, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { useGetDashboardQuery } from '@/redux/api/AdminDashboardApi';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

const Dashboard = () => {
  const { isSidebarOpen } = useSidebar();
  const { data, isLoading, error } = useGetDashboardQuery();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={`sm:p-0 lg:p-6 bg-gray-100 ${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
        <div className="sm:p-1 lg:p-6 space-y-6 min-h-screen">
          {/* Skeleton for Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(7)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton for Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Skeleton for Subscription Plans */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-8 w-24" />
              ))}
            </CardContent>
          </Card>

          {/* Skeleton for Latest Tables Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center space-y-0">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="ml-auto h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[...Array(3)].map((_, i) => (
                          <TableHead key={i}>
                            <Skeleton className="h-4 w-20" />
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          {[...Array(3)].map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">Error loading dashboard data</div>;
  }

  const handleComplaint = () => {
    navigate('/admin-dashboard/others/complaint');
  };

  const handlePlans = () => {
    navigate('/admin-dashboard/plans/subscriptions');
  };

  return (
    <div className={`sm:p-0 lg:p-6 bg-gray-100 ${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="sm:p-1 lg:p-6 space-y-6 min-h-screen">
        {/* Totals Section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalUsers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalMerchants.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Service Providers</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalServiceProviders.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalStudents.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Grocery Sellers</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalGrocerySellers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalAdmins.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sub-Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalSubAdmins.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={chartVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle>New Users (Bar Chart)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.newUsersBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={chartVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle>New Products per Month (Line Chart)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.newProductsLineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subscription Plans */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 group relative">
              <CardTitle>Subscription Plan User Counts</CardTitle>
              <button
                onClick={handlePlans}
                className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 hidden group-hover:flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                <Eye className="h-3 w-3" />
                View
              </button>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {data.subscriptionPlans.map((plan) => (
                <Badge key={plan?.plan} variant="secondary" className="text-lg px-4 py-2">
                  {plan?.plan}: {plan?.count.toLocaleString()}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Latest Tables Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 group relative">
                <CardTitle>Latest 5 Buy Leads</CardTitle>
                <ShoppingCart className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.latestBuyLeads.map((lead) => (
                      <TableRow key={lead?.id}>
                        <TableCell>{lead?.product}</TableCell>
                        <TableCell>{lead?.type}</TableCell>
                        <TableCell>{lead?.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 group relative">
                <CardTitle>Latest 5 Complaints</CardTitle>
                <AlertCircle className="ml-auto h-4 w-4 text-muted-foreground" />
                <button
                  onClick={handleComplaint}
                  className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 hidden group-hover:flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.latestComplaints.map((complaint) => (
                      <TableRow key={complaint?.id}>
                        <TableCell>{complaint?.user}</TableCell>
                        <TableCell>{complaint?.issue}</TableCell>
                        <TableCell>{complaint?.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 group relative">
                <CardTitle>Latest 5 Requirements for Grocery Sellers</CardTitle>
                <Apple className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.latestRequirements.map((req) => (
                      <TableRow key={req?.id}>
                        <TableCell>{req?.seller}</TableCell>
                        <TableCell>{req?.req}</TableCell>
                        <TableCell>{req?.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;