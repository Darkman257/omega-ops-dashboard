import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency, getDocumentStatus } from '@/lib/utils';

export default function Dashboard() {
  const { projects, employees, documents } = useAppContext();

  // KPIs
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const totalStaff = employees.length;
  const expiringDocs = documents.filter(d => getDocumentStatus(d.expiryDate) === 'Expiring Soon').length;
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const budgetUtil = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  // Chart Data
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const activityData = [
    { name: 'Mon', activities: 12 },
    { name: 'Tue', activities: 19 },
    { name: 'Wed', activities: 15 },
    { name: 'Thu', activities: 22 },
    { name: 'Fri', activities: 28 },
    { name: 'Sat', activities: 8 },
    { name: 'Sun', activities: 5 },
  ];

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const deptCounts = employees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Executive Overview</h1>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Active Projects", value: activeProjects, icon: Briefcase, color: "text-blue-400" },
          { title: "Total Staff", value: totalStaff, icon: Users, color: "text-green-400" },
          { title: "Expiring Documents", value: expiringDocs, icon: AlertTriangle, color: "text-orange-400" },
          { title: "Budget Utilization", value: `${budgetUtil}%`, icon: DollarSign, color: "text-primary" }
        ].map((kpi, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-[0_0_20px_rgba(201,168,76,0.1)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts */}
        <motion.div variants={itemVariants} className="col-span-4">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 15, 30, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="activities" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-3">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 15, 30, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center space-y-1">
                  <div className="text-muted-foreground text-sm font-medium">No data available</div>
                  <div className="text-xs text-muted-foreground/60">Add or upload projects to see status breakdown</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.client}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm text-primary">{formatCurrency(p.budget)}</div>
                        <div className="text-xs text-muted-foreground">{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No recent projects.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
            <CardHeader>
              <CardTitle>Staff Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(deptCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(deptCounts).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{dept}</span>
                      <span className="text-sm font-medium">{count} employee(s)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="text-sm text-muted-foreground font-medium">No data available</div>
                  <div className="text-xs text-muted-foreground/60">Add or upload staff to see department breakdown</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
}
