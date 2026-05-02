import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Briefcase, Users, AlertTriangle, DollarSign, 
  TrendingDown, ShieldAlert, Target, Activity, ExternalLink
} from 'lucide-react';
import { formatCurrency, getDocumentStatus } from '@/lib/utils';
import { getGlobalFinancials } from '@/lib/financials';

export default function Dashboard() {
  const { projects, employees, documents, payrollRecords } = useAppContext();
  const financialData = getGlobalFinancials(projects, payrollRecords);

  // KPIs
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const totalStaff = employees.length;
  const expiringDocs = documents.filter(d => getDocumentStatus(d.expiryDate) === 'Expiring Soon').length;
  const totalPayroll = financialData.totalPayrollCost;

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
          { title: "Total Payroll Cost", value: formatCurrency(totalPayroll), icon: TrendingDown, color: "text-primary" }
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

      {/* Financial Control Panel */}
      <motion.div variants={itemVariants}>
        <Card className="bg-primary/5 border-primary/20 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldAlert size={120} className="text-primary" />
          </div>
          <CardHeader className="border-b border-primary/10 bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Financial Control & Leak Detection
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">TRUTH-LOCK ACTIVE</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary" />
                  Highest Cost Site
                </p>
                <p className="text-lg font-bold">{financialData.highestCostSite}</p>
                <p className="text-[10px] text-muted-foreground">Based on current payroll</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-red-400" />
                  Projects at Risk
                </p>
                <p className="text-lg font-bold text-red-400">{financialData.projectsAtRisk}</p>
                <p className="text-[10px] text-muted-foreground">Burn rate &gt; 70%</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-orange-400" />
                  Payroll Leaks
                </p>
                <p className="text-lg font-bold text-orange-400">{financialData.leaksCount}</p>
                <p className="text-[10px] text-muted-foreground">Data integrity alerts</p>
              </div>

              <div className="flex items-end justify-end">
                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10 text-primary h-9 gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Detailed Report
                </Button>
              </div>
            </div>
            
            {financialData.leaks.length > 0 && (
              <div className="mt-6 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Critical Integrity Leaks</span>
                </div>
                <div className="space-y-2">
                  {financialData.leaks.slice(0, 2).map(leak => (
                    <div key={leak.id} className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>• {leak.description}</span>
                      <Badge variant="outline" className="h-4 text-[9px] border-orange-500/30 text-orange-400">{leak.severity}</Badge>
                    </div>
                  ))}
                  {financialData.leaks.length > 2 && (
                    <p className="text-[10px] text-muted-foreground italic">+{financialData.leaks.length - 2} more alerts in detailed report</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
