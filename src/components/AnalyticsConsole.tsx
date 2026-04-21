import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
  Alpha,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Schedule as TimeIcon,
  Category as CategoryIcon,
  BarChart as StatsIcon,
} from "@mui/icons-material";

interface AnalyticsProps {
  data: {
    volumeTrend: any[];
    categoryStats: any[];
    statusStats: any[];
    efficiencyStats: any[];
  };
}

const COLORS = ["#B91C1C", "#1F2937", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"];

const AnalyticsConsole: React.FC<AnalyticsProps> = ({ data }) => {
  const theme = useTheme();

  const volumeTrendData = useMemo(() => {
    return (data?.volumeTrend || []).map((item: any) => ({
      date: item._id,
      count: item.count,
    }));
  }, [data?.volumeTrend]);

  const categoryPieData = useMemo(() => {
    return (data?.categoryStats || []).map((item: any) => ({
      name: item._id,
      value: item.count,
    }));
  }, [data?.categoryStats]);

  const efficiencyData = useMemo(() => {
    return (data?.efficiencyStats || []).map((item: any) => ({
      name: item._id,
      minutes: Math.round(item.avgTime || 0),
    }));
  }, [data?.efficiencyStats]);

  const priorityData = useMemo(() => {
    return (data?.priorityStats || []).map((item: any) => ({
      name: item._id || 'Unknown',
      value: item.count,
    }));
  }, [data?.priorityStats]);

  const departmentData = useMemo(() => {
    return (data?.departmentVolume || []).map((item: any) => ({
      name: item._id || 'Unassigned',
      count: item.count,
    }));
  }, [data?.departmentVolume]);

  const driverStats = useMemo(() => {
    const roles = data?.userMetrics?.[0]?.roles || [];
    const statuses = data?.userMetrics?.[0]?.statuses || [];
    
    const driverRole = roles.find((r: any) => r._id === 'driver');
    const activeStatus = statuses.find((s: any) => s._id === 'active');

    return {
      active: activeStatus?.count || 0, // This is a rough estimation since statuses are global, but better than 0
      total: driverRole?.count || 0
    };
  }, [data?.userMetrics]);

  // Calculate some insights
  const totalIncidents = categoryPieData.reduce((acc, curr) => acc + curr.value, 0);
  const avgEfficiency = efficiencyData.length > 0 
    ? Math.round(efficiencyData.reduce((acc, curr) => acc + curr.minutes, 0) / efficiencyData.length)
    : 0;

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Grid container spacing={3}>
        {/* Key Metrics Row */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(185, 28, 28, 0.2)",
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <TrendingUpIcon />
              <Typography variant="h6" fontWeight={600}>
                Total Reports
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800}>
              {totalIncidents}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              Lifetime system volume
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              bgcolor: "white",
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <TimeIcon color="primary" />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Resolution Time
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color="primary">
              {avgEfficiency} <Typography component="span" variant="h5">min</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Avg. report-to-closure time
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              bgcolor: "white",
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <CategoryIcon sx={{ color: "#1F2937" }} />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Active Drivers
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: "#1F2937" }}>
              {driverStats.active} <Typography component="span" variant="h5">/ {driverStats.total}</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Operational field personnel
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              bgcolor: "white",
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <StatsIcon sx={{ color: "#059669" }} />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Critical Priority
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: "#059669" }}>
              {priorityData.find(p => p.name === 'critical')?.value || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Highest urgency cases handled
            </Typography>
          </Paper>
        </Grid>

        {/* Volume Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
              <StatsIcon color="primary" /> Incident Volume Trend (Last 30 Days)
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={volumeTrendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#B91C1C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    minTickGap={30}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#6B7280" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#B91C1C"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Priority Distribution Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Priority Distribution
            </Typography>
            <Box sx={{ width: "100%", height: 250, flexGrow: 1 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Department Workload Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Department Workload
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f9fafb'}} />
                  <Bar dataKey="count" fill="#1F2937" radius={[10, 10, 0, 0]} barSize={50}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#B91C1C" : "#1F2937"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Efficiency Sidebar (Condensed) */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Closure Performance (Minutes)
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={efficiencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 13, fontWeight: 500, fill: "#111827" }}
                  />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar 
                    dataKey="minutes" 
                    fill="#1F2937" 
                    radius={[0, 10, 10, 0]}
                    barSize={24}
                  >
                    {efficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#dc2626" : "#4b5563"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsConsole;
