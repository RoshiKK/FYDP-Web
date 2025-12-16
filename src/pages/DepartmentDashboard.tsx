import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AssignmentInd as AssignmentIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  LocalShipping as AmbulanceIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Timer as TimerIcon,
  DoneAll as DoneAllIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  Assignment as IncidentIcon,
  DirectionsCar as DriverIcon,
  PersonAdd as AssignIcon,
  Speed as SpeedIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocalShipping as VehicleIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Incident {
  _id: string;
  id: string;
  description: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    department: string;
    driver?: {
      _id: string;
      name: string;
    };
  };
  reportedBy: {
    name: string;
    phone: string;
  };
  patientStatus?: {
    condition: string;
    hospital: string;
  };
  driverStatus?: string;
  hospitalStatus?: string;
  photos?: Array<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  }>;
}

interface Driver {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  ambulanceService: string;
  drivingLicense: string;
  status: string;
  location?: {
    coordinates: [number, number];
  };
  currentLocation?: string;
  completedToday?: number;
}

interface DashboardStats {
  activeIncidents: number;
  availableDrivers: number;
  completedToday: number;
  totalAssigned: number;
  successRate: number;
}

interface DialogConfig {
  open: boolean;
  title: string;
  content: React.ReactNode;
  actions: React.ReactNode;
}

const DepartmentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeIncidents: 0,
    availableDrivers: 0,
    completedToday: 0,
    totalAssigned: 0,
    successRate: 0,
  });
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState<Driver | null>(null);
  const [driverDetailsDialogOpen, setDriverDetailsDialogOpen] = useState(false);
  
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    open: false,
    title: '',
    content: null,
    actions: null,
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Enhanced stat cards with proper widths
  const statCards = [
    { 
      title: 'Active Incidents', 
      value: stats.activeIncidents, 
      icon: <IncidentIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
    { 
      title: 'Available Drivers', 
      value: stats.availableDrivers, 
      icon: <DriverIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
    { 
      title: 'Completed Today', 
      value: stats.completedToday, 
      icon: <CheckIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
    { 
      title: 'Total Assigned', 
      value: stats.totalAssigned, 
      icon: <AssignmentIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
    { 
      title: 'Success Rate', 
      value: `${stats.successRate}%`, 
      icon: <TrendingIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
    { 
      title: 'Avg Response', 
      value: '12m', 
      icon: <SpeedIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      xs: 12, sm: 6, md: 4, lg: 2,
    },
  ];

  const getCompletedTodayCount = async (department: string): Promise<number> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const incidentsResponse = await axios.get('/api/incidents');
      let allIncidents: Incident[] = [];
      
      if (incidentsResponse.data.success) {
        const responseData = incidentsResponse.data.data;
        
        if (responseData && responseData.data) {
          allIncidents = responseData.data;
        } else if (Array.isArray(responseData)) {
          allIncidents = responseData;
        }
      }
      
      const completedToday = allIncidents.filter((incident) => {
        const assignedDept = incident.assignedTo?.department;
        const isCompleted = incident.status === 'completed';
        const updatedToday = new Date(incident.updatedAt) >= today;
        const isInDepartment = assignedDept === department;
        
        return isCompleted && updatedToday && isInDepartment;
      }).length;
      
      return completedToday;
    } catch (error) {
      console.error('Error counting completed incidents:', error);
      return 0;
    }
  };

  const getTotalAssignedCount = async (department: string): Promise<number> => {
    try {
      const incidentsResponse = await axios.get('/api/incidents');
      let allIncidents: Incident[] = [];
      
      if (incidentsResponse.data.success) {
        const responseData = incidentsResponse.data.data;
        
        if (responseData && responseData.data) {
          allIncidents = responseData.data;
        } else if (Array.isArray(responseData)) {
          allIncidents = responseData;
        }
      }
      
      const totalAssigned = allIncidents.filter((incident) => {
        const assignedDept = incident.assignedTo?.department;
        return assignedDept === department;
      }).length;
      
      return totalAssigned;
    } catch (error) {
      console.error('Error counting assigned incidents:', error);
      return 0;
    }
  };

  const loadDriversForDepartment = async (department: string) => {
    try {
      console.log('🚗 Loading drivers for department:', department);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Authentication token missing', 'error');
        return;
      }

      // Use the department-specific endpoint
      const response = await axios.get(`/api/users/department/drivers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Drivers API response:', response.data);
      
      if (response.data.success) {
        setDrivers(response.data.data);
        showSnackbar(`Loaded ${response.data.data.length} drivers for ${department}`, 'success');
      } else {
        showSnackbar('Failed to load drivers', 'error');
      }
    } catch (error: any) {
      console.error('💥 Error loading drivers:', error);
      
      // Fallback: Try generic endpoint if available
      const fallbackToken = localStorage.getItem('token');
      try {
        console.log('🔄 Trying generic endpoint...');
        
        const genericResponse = await axios.get(`/api/users/drivers/${department}`, {
          headers: {
            'Authorization': `Bearer ${fallbackToken}`
          }
        });
        
        if (genericResponse.data.success) {
          setDrivers(genericResponse.data.data);
        }
      } catch (fallbackError) {
        console.error('💥 All methods failed:', fallbackError);
        showSnackbar('Error loading drivers. Please try again.', 'error');
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading department dashboard data...');
      
      const storedUser = localStorage.getItem('user');
      let actualUser = user;
      let department = '';
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          department = parsedUser.department || user?.department || 'Edhi Foundation';
          actualUser = parsedUser;
        } catch (e) {
          console.log('❌ Error parsing stored user:', e);
        }
      }
      
      if (!department && actualUser) {
        try {
          const userResponse = await axios.get('/api/auth/me');
          if (userResponse.data.success) {
            actualUser = userResponse.data.data;
            department = actualUser?.department || user?.department || 'Edhi Foundation';
          }
        } catch (apiError) {
          console.log('⚠️ API call failed, using fallback department');
          department = user?.department || 'Edhi Foundation';
        }
      }
      
      console.log('🏢 Department for dashboard:', department);

      const incidentsResponse = await axios.get('/api/incidents');
      let allIncidents: Incident[] = [];
      
      if (incidentsResponse.data.success) {
        const responseData = incidentsResponse.data.data;
        
        if (responseData && responseData.data) {
          allIncidents = responseData.data;
        } else if (Array.isArray(responseData)) {
          allIncidents = responseData;
        }
      }
      
      console.log('📋 All incidents loaded:', allIncidents.length);
      
      const filteredIncidents = allIncidents.filter((incident) => {
        const assignedDept = incident.assignedTo?.department;
        const hasNoDriver = !incident.assignedTo?.driver;
        const isAssignedToDepartment = assignedDept === department;
        const isAvailableForAssignment = incident.status === 'assigned' && hasNoDriver;
        
        return isAssignedToDepartment && isAvailableForAssignment;
      });
      
      console.log('🎯 Available for assignment:', filteredIncidents.length);
      setActiveIncidents(filteredIncidents);
      
      await loadDriversForDepartment(department);
      
      const activeIncidentsCount = filteredIncidents.length;
      const availableDriversCount = drivers.filter(d => d.status === 'active').length;
      const completedToday = await getCompletedTodayCount(department);
      const totalAssigned = await getTotalAssignedCount(department);
      const successRate = totalAssigned > 0 ? Math.round((completedToday / totalAssigned) * 100) : 0;
      
      setStats({
        activeIncidents: activeIncidentsCount,
        availableDrivers: availableDriversCount,
        completedToday,
        totalAssigned,
        successRate,
      });
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      showSnackbar('Error loading dashboard data. Using cached information.', 'warning');
      
      setStats({
        activeIncidents: 0,
        availableDrivers: 0,
        completedToday: 0,
        totalAssigned: 0,
        successRate: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleViewIncidentDetails = (incident: Incident) => {
    if (!incident) {
      console.error('❌ Incident is undefined');
      showSnackbar('Incident details not available', 'error');
      return;
    }
    
    const incidentId = incident._id || incident.id || 'Unknown';
    const shortId = incidentId.length > 8 ? `${incidentId.substring(0, 8)}...` : incidentId;
    
    // Get the first photo URL if exists
    const firstPhotoUrl = incident.photos?.[0]?.url || '';
    
    showDialog({
      title: `Incident Details - ${shortId}`,
      content: (
        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Stack spacing={2}>
            {firstPhotoUrl && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img 
                  src={firstPhotoUrl} 
                  alt="Incident" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Box>
            )}
            
            <Typography variant="subtitle1" fontWeight="bold">
              {incident.description || `Incident ${shortId}`}
            </Typography>
            
            <Divider />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={(incident.status || 'Unknown').toUpperCase()} 
                  size="small"
                  color={getStatusColor(incident.status) as any}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Priority
                </Typography>
                <Chip 
                  label={(incident.priority || 'MEDIUM').toUpperCase()} 
                  size="small"
                  color={getPriorityColor(incident.priority) as any}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {incident.location?.address || 'Location not specified'}
                </Typography>
                {incident.location?.coordinates && (
                  <Typography variant="caption" color="text.secondary">
                    Coordinates: {incident.location.coordinates[0]?.toFixed(6)}, {incident.location.coordinates[1]?.toFixed(6)}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {incident.category || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Reported
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(incident.createdAt)}
                </Typography>
              </Grid>
              
              {incident.reportedBy && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Reported By
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1">
                      {incident.reportedBy.name || 'Unknown'}
                    </Typography>
                    {incident.reportedBy.phone && (
                      <Typography variant="body2" color="text.secondary">
                        ({incident.reportedBy.phone})
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
              
              {incident.assignedTo?.driver && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Assigned Driver
                  </Typography>
                  <Typography variant="body1">
                    {incident.assignedTo.driver.name || 'Unknown Driver'}
                  </Typography>
                </Grid>
              )}
              
              {incident.assignedTo?.department && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1">
                    {incident.assignedTo.department}
                  </Typography>
                </Grid>
              )}
              
              {incident.patientStatus?.condition && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Patient Condition
                  </Typography>
                  <Typography variant="body1">
                    {incident.patientStatus.condition}
                  </Typography>
                </Grid>
              )}
              
              {incident.patientStatus?.hospital && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Hospital
                  </Typography>
                  <Typography variant="body1">
                    {incident.patientStatus.hospital}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Incident ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {incidentId}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      ),
      actions: (
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Button 
            onClick={() => setDialogConfig({...dialogConfig, open: false})} 
            color="inherit"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
          {incident.location?.coordinates && (
            <Button
              variant="contained"
              onClick={() => window.open(
                `https://www.google.com/maps/search/?api=1&query=${incident.location?.coordinates[1]},${incident.location?.coordinates[0]}`,
                '_blank'
              )}
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              View on Map
            </Button>
          )}
        </Box>
      )
    });
  };

  const handleViewDriverDetails = (driver: Driver) => {
    setSelectedDriverForDetails(driver);
    setDriverDetailsDialogOpen(true);
  };

  const showDialog = (config: {
    title: string;
    content: React.ReactNode;
    actions: React.ReactNode;
  }) => {
    setDialogConfig({
      open: true,
      title: config.title,
      content: config.content,
      actions: config.actions
    });
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleAssignDriver = (incident: Incident) => {
    setSelectedIncident(incident);
    setAssignDialogOpen(true);
  };

  const handleConfirmAssignment = async () => {
    try {
      if (!selectedIncident || !selectedDriverId) return;
      
      console.log('🚗 Assigning driver:', selectedDriverId, 'to incident:', selectedIncident._id);
      
      const response = await axios.put(`/api/incidents/${selectedIncident._id}/assign`, {
        driverId: selectedDriverId,
        department: user?.department
      });
      
      if (response.data.success) {
        setActiveIncidents(prev => prev.filter(inc => inc._id !== selectedIncident._id));
        showSnackbar('Driver assigned successfully!', 'success');
        setAssignDialogOpen(false);
        setSelectedIncident(null);
        setSelectedDriverId('');
        loadDashboardData();
      } else {
        showSnackbar(response.data.message || 'Failed to assign driver', 'error');
      }
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      showSnackbar(error.response?.data?.message || 'Error assigning driver', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const pendingAssignments = activeIncidents.filter(inc => 
    inc.status === 'pending' || inc.status === 'assigned'
  ).length;

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 6,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #ffe5e5 0%, #fef2f2 100%)',
      }}
    >
      {/* Header */}
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Box textAlign="left">
          <Typography variant="h3" fontWeight={800} sx={{ color: '#111827' }}>
            DEPARTMENT DASHBOARD
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.department || 'Edhi Foundation'} • Managing emergency responses
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Notifications">
            <IconButton 
              onClick={() => setNotificationsOpen(true)}
              sx={{ position: 'relative' }}
            >
              <Badge badgeContent={pendingAssignments} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon className={refreshing ? 'spin' : ''} />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            onClick={() => logout()}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards - Fixed width layout */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card sx={{ 
              background: stat.color,
              color: '#fff',
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)' },
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  {stat.icon}
                </Box>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                  {stat.title}
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ fontSize: '1.8rem' }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_event, value) => setTabValue(value)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              py: 1.5,
            },
            '& .Mui-selected': {
              color: '#FF3B30',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FF3B30',
              height: 3,
            }
          }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <IncidentIcon />
                Active Incidents
                <Badge 
                  badgeContent={activeIncidents.length} 
                  color="error" 
                  sx={{ ml: 1 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <DriverIcon />
                Driver Management
                <Badge 
                  badgeContent={drivers.length} 
                  color="info" 
                  sx={{ ml: 1 }}
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingIcon />
                Performance Analytics
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Pending Assignments Alert */}
      {tabValue === 0 && pendingAssignments > 0 && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            alignItems: 'center'
          }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setNotificationsOpen(true)}
              sx={{ 
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              View All
            </Button>
          }
        >
          <Box>
            <Typography fontWeight="bold">
              {pendingAssignments} incident(s) need driver assignment
            </Typography>
            <Typography variant="body2">
              Urgent attention required for pending incidents
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Active Incidents Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {activeIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={6}>
                <Typography color="text.secondary" gutterBottom>
                  No active incidents available for assignment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Department: {user?.department}
                </Typography>
              </Box>
            </Grid>
          ) : (
            <>
              {/* Incidents List */}
              <Grid item xs={12} lg={8}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  minHeight: '500px'
                }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Active Incidents ({activeIncidents.length})
                  </Typography>
                  
                  <Box sx={{ maxHeight: '600px', overflowY: 'auto', pr: 1 }}>
                    {activeIncidents.map((incident) => (
                      <Card 
                        key={incident._id}
                        sx={{ 
                          mb: 2, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            boxShadow: 3,
                          },
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {incident.description || `Incident ${incident.id?.substring(0, 8)}`}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={2} mb={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <LocationIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {incident.location?.address || 'Location not specified'}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <TimeIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDateTime(incident.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Chip
                                label={incident.priority || 'Medium'}
                                size="small"
                                color={getPriorityColor(incident.priority) as any}
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                label={incident.status}
                                size="small"
                                color={getStatusColor(incident.status) as any}
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Chip
                                label={incident.category || 'Accident'}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                            <Box display="flex" gap={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewIncidentDetails(incident)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  borderRadius: 2,
                                }}
                              >
                                Details
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AssignIcon />}
                                onClick={() => handleAssignDriver(incident)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  borderRadius: 2,
                                }}
                              >
                                Assign Driver
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12} lg={4}>
                <Paper sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Quick Stats
                  </Typography>
                  <Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Response Time Distribution
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={75} 
                        sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        color="primary"
                      />
                      <Typography variant="caption">
                        75% under 15 minutes
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Incident Completion
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.successRate} 
                        sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                      <Typography variant="caption">
                        {stats.successRate}% success rate
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Driver Availability
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(stats.availableDrivers / Math.max(drivers.length, 1)) * 100} 
                        sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        color="info"
                      />
                      <Typography variant="caption">
                        {stats.availableDrivers} of {drivers.length} drivers available
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Recent Actions
                  </Typography>
                  <List dense>
                    {activeIncidents.slice(0, 5).map((incident) => (
                      <ListItem 
                        key={incident._id}
                        sx={{ 
                          py: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              New incident reported in {incident.location?.address?.split(',')[0] || 'unknown location'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(incident.createdAt)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* Driver Management Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Driver Statistics */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Driver Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    color: '#fff',
                    borderRadius: 3,
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {drivers.filter(d => d.status === 'active').length}
                      </Typography>
                      <Typography variant="body2">
                        Available
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#fff',
                    borderRadius: 3,
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {drivers.filter(d => d.status !== 'active').length}
                      </Typography>
                      <Typography variant="body2">
                        Busy/Offline
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    color: '#fff',
                    borderRadius: 3,
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {drivers.length}
                      </Typography>
                      <Typography variant="body2">
                        Total Drivers
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: '#fff',
                    borderRadius: 3,
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {drivers.reduce((sum, driver) => sum + (driver.completedToday || 0), 0)}
                      </Typography>
                      <Typography variant="body2">
                        Total Completed Today
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Drivers List */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Available Drivers ({drivers.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  Refresh
                </Button>
              </Box>
              
              {drivers.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography color="text.secondary" gutterBottom>
                    No drivers available in this department
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '200px' }}>Driver Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Completed Today</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '150px' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow 
                          key={driver._id} 
                          hover
                          sx={{ 
                            '&:hover': { backgroundColor: 'action.hover' },
                            cursor: 'pointer'
                          }}
                          onClick={() => handleViewDriverDetails(driver)}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                {driver.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={600}>{driver.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {driver.department}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={driver.status === 'active' ? 'Available' : 'Busy'}
                              color={driver.status === 'active' ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 600, minWidth: '80px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography>{driver.phone}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {driver.currentLocation || 'Unknown'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              badgeContent={driver.completedToday || 0} 
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontWeight: 600
                                }
                              }}
                            >
                              <AssignmentIcon color="action" />
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small"
                              variant="outlined"
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDriverDetails(driver);
                              }}
                            >
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Performance Analytics Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
            }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Performance Analytics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <TimerIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Response Time
                        </Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        12m
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average response time
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={75} 
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">
                        25% faster than last month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <DoneAllIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Completion Rate
                        </Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="success">
                        {stats.successRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successfully resolved incidents
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.successRate} 
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                      <Typography variant="caption">
                        {stats.completedToday} completed today
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <TrendingIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Monthly Trends
                        </Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="info">
                        +15%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Increase in efficiency
                      </Typography>
                      <Box mt={2}>
                        <Typography variant="caption" color="text.secondary">
                          Incidents handled this month: {stats.totalAssigned}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <AmbulanceIcon color="secondary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Driver Performance
                        </Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="secondary">
                        94%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Driver availability rate
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={94} 
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                        color="secondary"
                      />
                      <Typography variant="caption">
                        {stats.availableDrivers}/{drivers.length} drivers currently active
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Department Stats Card */}
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight={600}>
                        Department Stats
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                            color: '#fff',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h3" fontWeight={700}>{stats.successRate}%</Typography>
                            <Typography variant="body2">Success Rate</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                            color: '#fff',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h3" fontWeight={700}>{stats.totalAssigned}</Typography>
                            <Typography variant="body2">Monthly Incidents</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            color: '#fff',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h3" fontWeight={700}>12m</Typography>
                            <Typography variant="body2">Avg Response</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            color: '#fff',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h3" fontWeight={700}>{stats.availableDrivers}/{drivers.length}</Typography>
                            <Typography variant="body2">Active Drivers</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          Last updated: {new Date().toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Assign Driver Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedIncident(null);
          setSelectedDriverId('');
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentIcon />
            Assign Driver to Incident
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Incident Details
              </Typography>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {selectedIncident.description || `Incident ${selectedIncident.id?.substring(0, 8)}`}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {selectedIncident.location?.address}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(selectedIncident.createdAt)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          )}
          
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Select Driver
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Available Drivers</InputLabel>
            <Select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              label="Available Drivers"
              sx={{ mb: 2 }}
            >
              {drivers
                .filter(driver => driver.status === 'active')
                .map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <Typography>{driver.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {driver.phone} • {driver.completedToday || 0} completed today
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
            <Typography variant="body2">
              {drivers.filter(d => d.status === 'active').length} drivers available for assignment
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setAssignDialogOpen(false);
              setSelectedIncident(null);
              setSelectedDriverId('');
            }}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAssignment} 
            variant="contained" 
            disabled={!selectedDriverId}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Assign Driver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog
        open={driverDetailsDialogOpen}
        onClose={() => setDriverDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3
          }
        }}
      >
        {selectedDriverForDetails && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main',
                  width: 48,
                  height: 48
                }}>
                  {selectedDriverForDetails.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedDriverForDetails.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Driver Profile
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Contact Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <PhoneIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography>{selectedDriverForDetails.phone}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <EmailIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography>{selectedDriverForDetails.email}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <LocationIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Department</Typography>
                          <Typography>{selectedDriverForDetails.department}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Driver Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <VehicleIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Ambulance Service</Typography>
                          <Typography>{selectedDriverForDetails.ambulanceService}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <BadgeIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Driving License</Typography>
                          <Typography>{selectedDriverForDetails.drivingLicense}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <AssignmentIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Completed Today</Typography>
                          <Typography fontWeight={600}>{selectedDriverForDetails.completedToday || 0} incidents</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Status & Location
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Chip
                          label={selectedDriverForDetails.status === 'active' ? 'Available' : 'Busy'}
                          color={selectedDriverForDetails.status === 'active' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationIcon color="action" />
                        <Typography variant="body2">
                          Current Location: {selectedDriverForDetails.currentLocation || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setDriverDetailsDialogOpen(false)}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Close
              </Button>
              {selectedDriverForDetails.status === 'active' && (
                <Button 
                  variant="contained"
                  onClick={() => {
                    // Here you could add logic to assign this driver directly
                    setDriverDetailsDialogOpen(false);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  Assign to Incident
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Incident Details Dialog */}
      <Dialog
        open={dialogConfig.open}
        onClose={() => setDialogConfig({...dialogConfig, open: false})}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            maxHeight: '90vh',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{dialogConfig.title}</DialogTitle>
        <DialogContent dividers>
          {dialogConfig.content}
        </DialogContent>
        <DialogActions>{dialogConfig.actions}</DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box display="flex" alignItems="center">
            <NotificationsIcon sx={{ mr: 1 }} />
            Notifications
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {pendingAssignments === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No pending notifications
            </Alert>
          ) : (
            <List>
              {activeIncidents
                .filter(inc => inc.status === 'pending' || inc.status === 'assigned')
                .slice(0, 5)
                .map((incident) => (
                  <ListItem 
                    key={incident._id}
                    sx={{ 
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <WarningIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="New Incident Requires Assignment"
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {incident.description?.substring(0, 60)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(incident.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setNotificationsOpen(false)}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Overlay */}
      {refreshing && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(255, 255, 255, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Container>
  );
};

export default DepartmentDashboard;