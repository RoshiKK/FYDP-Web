import React, { useState, useEffect, JSX } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  TextField,
  CircularProgress,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  MicNone as MicIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Image as ImageIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon,
  Task as TaskIcon,
  NavigateBefore,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DriverService, { DriverIncident } from '../services/driverService';

// Define API_URL constant
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define types
interface CurrentJob {
  id: string;
  incident: DriverIncident;
  status: 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed';
  assignedTime: string;
  estimatedArrival?: string;
}

interface Hospital {
  id: string;
  name: string;
  type: string;
  distance: string;
  isPinned: boolean;
}

// Status mapping for UI
const STATUS_MAPPING: Record<string, string> = {
  'assigned': 'assigned',
  'arrived': 'arrived', 
  'transporting': 'transporting',
  'delivered': 'delivered',
  'completed': 'completed'
};

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // State declarations
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  
  const [driverStats, setDriverStats] = useState({
    completedToday: 0,
    totalDistance: '0 km',
    avgResponseTime: '0 mins',
    successRate: '0%',
    activeAssignments: 0,
  });
  
  const [assignedIncidents, setAssignedIncidents] = useState<DriverIncident[]>([]);
  const [completedIncidents, setCompletedIncidents] = useState<DriverIncident[]>([]);
  const [currentJob, setCurrentJob] = useState<CurrentJob | null>(null);
  
  const [patientStatusDialog, setPatientStatusDialog] = useState<boolean>(false);
  const [hospitalDialog, setHospitalDialog] = useState<boolean>(false);
  const [feedbackDialog, setFeedbackDialog] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Available hospitals
  const hospitals: Hospital[] = [
    { id: 'h1', name: 'Jinnah Hospital', type: 'General', distance: '2.5 km', isPinned: true },
    { id: 'h2', name: 'Cardiac Center', type: 'Cardio', distance: '4.1 km', isPinned: true },
    { id: 'h3', name: 'City General Hospital', type: 'General', distance: '6.8 km', isPinned: false },
    { id: 'h4', name: 'Emergency Medical Center', type: 'Emergency', distance: '3.2 km', isPinned: false },
    { id: 'h5', name: 'South City Hospital', type: 'Private', distance: '5.4 km', isPinned: false },
  ];

  // Calculate statistics from incidents
  const calculateStats = (assigned: DriverIncident[], completed: DriverIncident[]) => {
  // Calculate completed today
  const today = new Date().toDateString();
  const completedToday = completed.filter(incident => {
    const incidentDate = new Date(incident.createdAt).toDateString();
    return incidentDate === today;
  }).length;

  // Calculate average response time (in minutes)
  let totalResponseTime = 0;
  let validResponseTimes = 0;
  
  completed.forEach(incident => {
    const startTime = new Date(incident.createdAt).getTime();
    const endTime = incident.updatedAt ? new Date(incident.updatedAt).getTime() : new Date().getTime();
    
    if (endTime > startTime) {
      const responseTime = Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
      totalResponseTime += responseTime;
      validResponseTimes++;
    }
  });
  
  const avgResponseTime = validResponseTimes > 0 
    ? `${Math.round(totalResponseTime / validResponseTimes)} mins`
    : '0 mins';

  // Calculate success rate based on incidents where status is 'completed'
  // You might want to check for other successful statuses if they exist
  const totalAssigned = assigned.length + completed.length;
  const successRate = totalAssigned > 0 
    ? `${Math.round((completed.length / totalAssigned) * 100)}%`
    : '0%';

  // Calculate total distance - this would ideally come from GPS tracking data
  // For now, we'll use a placeholder or calculate from incident locations if available
  let totalDistance = '0 km';
  
  // If you have distance data in incidents, you could calculate it like:
  // const totalKm = completed.reduce((sum, incident) => sum + (incident.distance || 0), 0);
  // totalDistance = `${totalKm} km`;
  
  // For demonstration, let's use a reasonable estimate: 15km per completed incident
  const estimatedKmPerIncident = 15;
  const totalKm = completed.length * estimatedKmPerIncident;
  totalDistance = `${totalKm} km`;

  return {
    completedToday,
    totalDistance,
    avgResponseTime,
    successRate,
    activeAssignments: assigned.length,
  };
};

  // Initialize driver data
  const initializeDriverData = async (): Promise<void> => {
  setIsLoading(true);
  try {
    console.log('🚗 Initializing driver data...');
    
    // Debug driver info
    await DriverService.debugDriverInfo();
    
    // Get driver incidents
    const incidentsResult = await DriverService.getMyAssignedIncidents();
    
    console.log('📊 Incidents result:', incidentsResult);

    if (incidentsResult.success) {
      const incidents = incidentsResult.data;
      
      // Filter based on user role
      let filteredIncidents = incidents;
      
      // If user is superadmin, show all driver incidents
      if (user?.role === 'superadmin') {
        console.log('👑 Super Admin viewing all driver incidents');
        // Already filtered in service
      } else {
        // For drivers, filter their own incidents
        filteredIncidents = incidents.filter((incident: DriverIncident) => 
          incident.assignedTo?.driver === user?.id ||
          incident.assignedTo?.driver?._id === user?.id
        );
      }
      
      // Separate assigned and completed incidents
      const assigned = filteredIncidents.filter((incident: DriverIncident) => 
        incident.status === 'assigned' || incident.status === 'in_progress'
      );
      
      const completed = filteredIncidents.filter((incident: DriverIncident) => 
        incident.status === 'completed'
      );
      
      setAssignedIncidents(assigned);
      setCompletedIncidents(completed);
      
      console.log(`✅ Loaded ${assigned.length} assigned, ${completed.length} completed incidents`);
      
      // Calculate statistics from the incidents
      const calculatedStats = calculateStats(assigned, completed);
      setDriverStats(calculatedStats);
      console.log('📈 Calculated stats:', calculatedStats);
      
      // Set current job - prioritize in-progress incidents
      if (assigned.length > 0) {
        const firstAssigned = assigned.find(inc => inc.status === 'assigned') || assigned[0];
        
        if (firstAssigned) {
          const jobStatus = STATUS_MAPPING[firstAssigned.driverStatus] || 'assigned';
          
          setCurrentJob({
            id: firstAssigned.id,
            incident: firstAssigned,
            status: jobStatus as 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed',
            assignedTime: firstAssigned.createdAt || new Date().toISOString(),
            estimatedArrival: '5 mins',
          });
          
          console.log('🎯 Set current job:', {
            id: firstAssigned.id,
            status: jobStatus,
            description: firstAssigned.description?.substring(0, 50)
          });
        }
      } else {
        console.log('ℹ️ No assigned incidents found');
        setCurrentJob(null);
      }
    } else {
      console.error('❌ Failed to load incidents:', incidentsResult.error);
      showSnackbar(`Failed to load incidents: ${incidentsResult.error}`, 'error');
    }
    
  } catch (error: any) {
    console.error('❌ Error initializing driver data:', error);
    showSnackbar(`Error loading data: ${error.message}`, 'error');
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await initializeDriverData();
    showSnackbar('Data refreshed successfully', 'success');
  };

  // Get job status from incident
  const getJobStatus = (incident: DriverIncident): 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed' => {
    return STATUS_MAPPING[incident.driverStatus] as 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed' || 'assigned';
  };

  // Get status step for stepper
  const getStatusStep = (status: string): number => {
    const steps = ['assigned', 'arrived', 'transporting', 'delivered', 'completed'];
    return Math.max(0, steps.indexOf(status));
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: 'arrived' | 'transporting' | 'delivered' | 'completed'): Promise<void> => {
    if (!currentJob || !currentJob.incident?.id) {
      console.error('❌ No current job or job ID found');
      showSnackbar('Please select an incident from the list below first', 'warning');
      return;
    }
    
    try {
      console.log('🚑 Updating status:', {
        incidentId: currentJob.incident.id,
        status: newStatus,
        hospital: selectedHospital || 'Jinnah Hospital'
      });
      
      const result = await DriverService.updateIncidentStatus(
        currentJob.incident.id,
        newStatus,
        selectedHospital || 'Jinnah Hospital',
        'Patient being transported'
      );
      
      if (result.success) {
        showSnackbar(`Status updated to ${newStatus} successfully!`, 'success');
        // Refresh the data
        await initializeDriverData();
      } else {
        showSnackbar(`Failed to update status: ${result.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      showSnackbar(`Error: ${error.message || 'Failed to update status'}`, 'error');
    }
  };

  // Handle select incident from list
  const handleSelectIncident = (incident: DriverIncident) => {
    const jobStatus = getJobStatus(incident);
    
    setCurrentJob({
      id: incident.id,
      incident,
      status: jobStatus,
      assignedTime: incident.createdAt || new Date().toISOString(),
      estimatedArrival: '5 mins',
    });
    
    console.log('🎯 Selected incident:', incident.id);
    showSnackbar(`Selected incident: ${incident.description?.substring(0, 30)}...`, 'info');
  };

  // Handle patient status
  const handlePatientStatus = (status: 'taken_elsewhere' | 'expired' | 'picked_up'): void => {
    if (status === 'picked_up') {
      setPatientStatusDialog(false);
      setHospitalDialog(true);
    } else {
      setPatientStatusDialog(false);
      if (status === 'expired') {
        setSelectedHospital('Jinnah Hospital');
        setHospitalDialog(true);
      }
    }
  };

  // Handle hospital selection
  const handleHospitalSelection = (): void => {
    if (selectedHospital) {
      setHospitalDialog(false);
      handleStatusUpdate('transporting');
    } else {
      showSnackbar('Please select a hospital', 'warning');
    }
  };

  // Handle arrival at hospital
  const handleArrivalAtHospital = (): void => {
    if (!selectedHospital) {
      setSelectedHospital('Jinnah Hospital');
    }
    handleStatusUpdate('delivered');
  };

  // Handle complete job
  const handleCompleteJob = (): void => {
    handleStatusUpdate('completed');
    setFeedbackDialog(false);
  };

  // Extract photo URL from incident
  const extractPhotoUrl = (incident: DriverIncident): string | null => {
    if (!incident.photos || incident.photos.length === 0) {
      return null;
    }

    const photo = incident.photos[0];
    
    // Handle different photo formats
    if (typeof photo === 'string') {
      return photo;
    } else if (typeof photo === 'object' && photo !== null) {
      const photoObj = photo as any;
      
      if (photoObj.filename) {
        return photoObj.filename;
      } else if (photoObj.url) {
        return photoObj.url;
      } else if (photoObj.imageUrl) {
        return photoObj.imageUrl;
      }
    }
    
    return null;
  };

  // Generate image URLs to try
  const getImageUrlsToTry = (baseUrl: string | null): string[] => {
    if (!baseUrl) return [];
    
    const urls: string[] = [];
    
    // Clean up the URL
    let cleanUrl = baseUrl;
    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    
    // If it's already a full URL, just return it
    if (cleanUrl.startsWith('http')) {
      urls.push(cleanUrl);
    } else {
      // GridFS endpoint patterns
      urls.push(`${API_URL}/api/upload/image/${cleanUrl}`);
      urls.push(`${API_URL}/api/uploads/image/${cleanUrl}`);
      
      // Alternative server IPs
      urls.push(`http://192.168.100.22:5000/api/upload/image/${cleanUrl}`);
      urls.push(`http://192.168.100.22:5000/api/uploads/image/${cleanUrl}`);
      
      // Localhost patterns
      urls.push(`http://localhost:5000/api/upload/image/${cleanUrl}`);
      urls.push(`http://localhost:5000/api/uploads/image/${cleanUrl}`);
    }
    
    // Remove duplicates
    const uniqueUrls = urls.filter((url, index, self) => self.indexOf(url) === index);
    
    return uniqueUrls;
  };

  // Render incident image with fallback
  const renderIncidentImage = (incident: DriverIncident): JSX.Element => {
    const imageUrl = extractPhotoUrl(incident);
    
    if (!imageUrl) {
      return (
        <Box
          sx={{
            width: '100%',
            height: 200,
            bgcolor: 'grey.200',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.500',
          }}
        >
          <ImageIcon sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="body2">No image available</Typography>
        </Box>
      );
    }

    const urls = getImageUrlsToTry(imageUrl);
    const firstUrl = urls[0];

    return (
      <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
        <Box
          component="img"
          src={firstUrl}
          alt="Incident"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 2,
            backgroundColor: '#f0f0f0',
          }}
        />
      </Box>
    );
  };

  // Stat cards configuration
  const statCards = [
    { 
      title: 'Completed Today', 
      value: driverStats.completedToday, 
      icon: <CheckIcon sx={{ color: '#fff' }} />, 
      color: '#DC2626' 
    },
    { 
      title: 'Distance Covered', 
      value: driverStats.totalDistance, 
      icon: <CarIcon sx={{ color: '#fff' }} />, 
      color: '#DC2626' 
    },
    { 
      title: 'Avg Response Time', 
      value: driverStats.avgResponseTime, 
      icon: <TimerIcon sx={{ color: '#fff' }} />, 
      color: '#DC2626' 
    },
    { 
      title: 'Success Rate', 
      value: driverStats.successRate, 
      icon: <CheckIcon sx={{ color: '#fff' }} />, 
      color: '#DC2626' 
    },
  ];

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Initialize on component mount
  useEffect(() => {
    initializeDriverData();
  }, []);

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <Container maxWidth="lg" sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 3,
        backgroundColor: '#ffe5e5'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading driver dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#ffe5e5' }}>
      {/* Dashboard Header */}
      <Box mb={4} textAlign="center">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: '#111827' }}>
              DRIVER DASHBOARD
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.name || 'Driver'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.department || 'Emergency Services'}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <IconButton 
              onClick={refreshData} 
              disabled={isRefreshing}
              sx={{ 
                backgroundColor: '#fff',
                '&:hover': { backgroundColor: '#f8d7d7' }
              }}
            >
              <RefreshIcon sx={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
            <IconButton sx={{ 
              backgroundColor: '#fff',
              '&:hover': { backgroundColor: '#f8d7d7' }
            }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ 
              bgcolor: '#DC2626',
              width: 40,
              height: 40
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'D'}
            </Avatar>
          </Box>
        </Box>

        {/* Status Indicator */}
        <Box display="flex" alignItems="center" gap={1} mb={3} justifyContent="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: assignedIncidents.length === 0 ? 'success.main' : 'warning.main',
              animation: assignedIncidents.length > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)' },
              }
            }}
          />
          <Typography variant="body2" fontWeight={600}>
            {assignedIncidents.length === 0 ? 'AVAILABLE' : 'ON DUTY'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            {assignedIncidents.length} active assignment(s)
          </Typography>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              background: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
              color: '#fff',
              borderRadius: 3,
              boxShadow: 2,
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {stat.icon}
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ fontSize: '2rem' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Debug information (remove in production) */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, display: 'none' }}>
        <Typography variant="h6" color="error">DEBUG DATA:</Typography>
        <Typography variant="body2">
          Completed Today: {driverStats.completedToday}<br/>
          Total Distance: {driverStats.totalDistance}<br/>
          Avg Response Time: {driverStats.avgResponseTime}<br/>
          Success Rate: {driverStats.successRate}<br/>
          Assigned Incidents: {assignedIncidents.length}<br/>
          Completed Incidents: {completedIncidents.length}
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#fff', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom textAlign="center">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => showSnackbar('Emergency protocol activated', 'warning')}
                  >
                    Emergency
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<LocationIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => {
                      if (currentJob?.incident?.location?.address) {
                        window.open(`https://maps.google.com/?q=${currentJob.incident.location.address}`, '_blank');
                      } else {
                        showSnackbar('No location available for navigation', 'info');
                      }
                    }}
                  >
                    Navigation
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<ChatIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => showSnackbar('Connecting to support...', 'info')}
                  >
                    Support
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTabIndex} 
          onChange={(_, newValue: number) => setCurrentTabIndex(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontWeight: 600,
            }
          }}
          centered
        >
          <Tab 
            icon={<AssignmentIcon />} 
            label={`Assigned (${assignedIncidents.length})`} 
            iconPosition="start" 
          />
          <Tab 
            icon={<HistoryIcon />} 
            label={`Completed (${completedIncidents.length})`} 
            iconPosition="start" 
          />
        </Tabs>
      </Box>

      {/* Content based on active tab */}
      {currentTabIndex === 0 ? (
        <Grid container spacing={3} justifyContent="center">
          {/* Current Assignment */}
          {currentJob ? (
            <Grid item xs={12} md={8}>
              <Card elevation={3} sx={{ backgroundColor: '#fff', height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">Current Assignment</Typography>
                    <Chip 
                      label={currentJob.incident.priority?.toUpperCase() || 'URGENT'} 
                      color={currentJob.incident.priority === 'urgent' ? 'error' : 'warning'} 
                      size="small"
                    />
                  </Box>

                  {/* Progress Stepper */}
                  <Stepper 
                    activeStep={getStatusStep(currentJob.status)} 
                    alternativeLabel 
                    sx={{ mb: 3 }}
                  >
                    {['Assigned', 'Arrived', 'Transporting', 'Delivered', 'Completed'].map((label, idx) => (
                      <Step key={idx}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {/* Incident Image */}
                  {renderIncidentImage(currentJob.incident)}

                  <Alert 
                    severity="info" 
                    sx={{ mt: 2, mb: 2 }}
                    icon={<TaskIcon />}
                  >
                    <Typography variant="body2">
                      {currentJob.incident.description || 'Accident reported'}
                    </Typography>
                  </Alert>

                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={currentJob.incident.location?.address || 'Unknown Location'} 
                        secondary="Incident Location" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimerIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Reported ${new Date(currentJob.incident.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}`}
                        secondary={currentJob.estimatedArrival && `ETA: ${currentJob.estimatedArrival}`}
                      />
                    </ListItem>
                    {currentJob.incident.patientStatus?.condition && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={currentJob.incident.patientStatus.condition}
                          secondary="Patient Condition"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>

                <CardActions sx={{ justifyContent: 'center', pb: 3, px: 2 }}>
                  {currentJob.status === 'assigned' && (
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={() => handleStatusUpdate('arrived')} 
                      startIcon={<CarIcon />}
                      fullWidth
                    >
                      Start Journey
                    </Button>
                  )}
                  {currentJob.status === 'arrived' && (
                    <Button 
                      variant="contained" 
                      size="large" 
                      color="warning" 
                      onClick={() => setPatientStatusDialog(true)} 
                      startIcon={<PersonIcon />}
                      fullWidth
                    >
                      Update Patient Status
                    </Button>
                  )}
                  {currentJob.status === 'transporting' && (
                    <Button 
                      variant="contained" 
                      size="large" 
                      color="info" 
                      onClick={handleArrivalAtHospital} 
                      startIcon={<HospitalIcon />}
                      fullWidth
                    >
                      Arrived at Hospital
                    </Button>
                  )}
                  {currentJob.status === 'delivered' && (
                    <Button 
                      variant="contained" 
                      size="large" 
                      color="success" 
                      onClick={() => handleStatusUpdate('completed')} 
                      startIcon={<CheckIcon />}
                      fullWidth
                    >
                      Complete Mission
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ) : (
            <Grid item xs={12} md={8}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                p: 4, 
                backgroundColor: '#ffe5e5',
                borderRadius: 3
              }}>
                <Box textAlign="center">
                  <AssignmentIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Active Assignment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select an incident from the list to start working
                  </Typography>
                </Box>
              </Card>
            </Grid>
          )}

          {/* Sidebar with Quick Actions and Nearby Hospitals */}
          <Grid item xs={12} md={currentJob ? 4 : 12}>
            {/* Quick Actions */}
            <Card sx={{ mb: 3, backgroundColor: '#fff', textAlign: 'center', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <List sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <ListItem sx={{ width: '80%' }}>
                    <ListItemIcon><PhoneIcon /></ListItemIcon>
                    <ListItemText primary="Emergency Contact" secondary="Call Dispatch" />
                  </ListItem>
                  <ListItem sx={{ width: '80%' }}>
                    <ListItemIcon><NavigateBefore /></ListItemIcon>
                    <ListItemText primary="Navigation" secondary="Open in Maps" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Nearby Hospitals */}
            <Card sx={{ backgroundColor: '#fff', textAlign: 'center', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Nearby Hospitals</Typography>
                <List dense sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {hospitals.filter(h => h.isPinned).map((hospital) => (
                    <ListItem key={hospital.id} sx={{ width: '90%' }}>
                      <ListItemIcon><HospitalIcon color="primary" /></ListItemIcon>
                      <ListItemText primary={hospital.name} secondary={`${hospital.type} • ${hospital.distance}`} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* All Assigned Incidents */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#fff', borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Available Incidents
                  </Typography>
                  <Chip 
                    label={`${assignedIncidents.length} total`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                {assignedIncidents.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <TaskIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No incidents assigned
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You will see incidents here when they are assigned to you
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                    {assignedIncidents.map((incident) => {
                      const isSelected = currentJob?.id === incident.id;
                      return (
                        <React.Fragment key={incident.id}>
                          <ListItem 
                            button 
                            selected={isSelected}
                            onClick={() => handleSelectIncident(incident)}
                            sx={{
                              borderRadius: 2,
                              mb: 1,
                              backgroundColor: isSelected ? '#f8d7d7' : 'transparent',
                              '&:hover': {
                                backgroundColor: '#f8d7d7',
                              }
                            }}
                          >
                            <ListItemIcon>
                              <LocationIcon color={isSelected ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                  {incident.location?.address?.split(',')[0] || 'Unknown Location'}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {incident.driverStatus} • {new Date(incident.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Typography>
                              }
                            />
                            {isSelected ? (
                              <CheckIcon color="primary" />
                            ) : (
                              <ArrowForwardIcon color="action" />
                            )}
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* Completed Incidents Tab */
        <Grid container spacing={3} justifyContent="center">
          {completedIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: '#fff', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <CheckIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No completed incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed incidents will appear here
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            completedIncidents.map((incident) => (
              <Grid item xs={12} md={6} lg={4} key={incident.id}>
                <Card sx={{ backgroundColor: '#fff', borderRadius: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {incident.location?.address?.split(',')[0] || 'Unknown Location'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(incident.createdAt).toLocaleDateString()} • {incident.patientStatus?.hospital || 'Hospital'}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Completed" 
                        color="success" 
                        size="small" 
                        icon={<CheckIcon />}
                      />
                    </Box>
                    
                    {renderIncidentImage(incident)}
                    
                    <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                      {incident.description?.substring(0, 100) || 'Accident reported'}...
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        icon={<TimerIcon />}
                        label={`${Math.round((new Date(incident.updatedAt).getTime() - new Date(incident.createdAt).getTime()) / 60000)} min`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<HospitalIcon />}
                        label={incident.patientStatus?.hospital || 'Hospital'}
                        size="small"
                        variant="outlined"
                      />
                      {incident.patientStatus?.condition && (
                        <Chip
                          label={incident.patientStatus.condition}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Dialogs */}
      <Dialog open={patientStatusDialog} onClose={() => setPatientStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Patient Status</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Please select the current status of the patient:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => handlePatientStatus('taken_elsewhere')}
                sx={{ py: 2 }}
              >
                Patient Taken by Someone Else
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => handlePatientStatus('expired')}
                sx={{ py: 2 }}
              >
                Patient Expired
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckIcon />}
                onClick={() => handlePatientStatus('picked_up')}
                sx={{ py: 2 }}
              >
                Patient Picked Up
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <Dialog open={hospitalDialog} onClose={() => setHospitalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Destination Hospital</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value as string)}
              label="Hospital"
            >
              {hospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.name}>
                  {hospital.name} - {hospital.type} ({hospital.distance})
                  {hospital.isPinned && ' ⭐'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info">
            The selected hospital will be notified of your arrival
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHospitalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleHospitalSelection}
            variant="contained"
            disabled={!selectedHospital}
          >
            Confirm & Transport
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Job Completed - Feedback</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Patient successfully delivered to hospital
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Feedback (Optional)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Any additional information about the incident..."
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MicIcon />}
            sx={{ mb: 1 }}
          >
            Record Voice Message
          </Button>
          <TextField
            fullWidth
            label="Hospital Patient ID (Optional)"
            placeholder="Enter patient ID from hospital"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Skip</Button>
          <Button onClick={handleCompleteJob} variant="contained">
            Submit & Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DriverDashboard;