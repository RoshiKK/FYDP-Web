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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Tab,
  Tabs,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  InputAdornment,
  TableHead,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  DirectionsCar as AmbulanceIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  NotificationsActive as NotificationIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MedicalServices as MedicalIcon,
  Visibility as ViewIcon,
  MedicalServices as AdmitIcon,
  ExitToApp as DischargeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import HospitalService, { 
  HospitalIncident, 
  HospitalStats
} from '../services/hospitalService';
import PatientDetailsDialog from '../components/PatientDetailsDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hospital-tabpanel-${index}`}
      aria-labelledby={`hospital-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [incomingIncidents, setIncomingIncidents] = useState<HospitalIncident[]>([]);
  const [admittedIncidents, setAdmittedIncidents] = useState<HospitalIncident[]>([]);
  const [dischargedIncidents, setDischargedIncidents] = useState<HospitalIncident[]>([]);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({
    incomingCases: 0,
    receivedCases: 0,
    hospitalStats: [],
    incomingIncidents: [],
    hospitalName: user?.hospital || 'Hospital'
  });
  const [selectedIncident, setSelectedIncident] = useState<HospitalIncident | null>(null);
  const [admitDialog, setAdmitDialog] = useState(false);
  const [dischargeDialog, setDischargeDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [admitForm, setAdmitForm] = useState({
    medicalNotes: '',
    treatment: '',
    doctor: '',
    bedNumber: '',
  });
  const [dischargeForm, setDischargeForm] = useState({
    medicalNotes: '',
    treatment: '',
  });
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Statistics calculations
  const incomingCases = incomingIncidents.length;
  const admittedCases = admittedIncidents.length;
  const dischargedCases = dischargedIncidents.length;
  const totalCases = incomingCases + admittedCases + dischargedCases;
  const hospitalName = hospitalStats.hospitalName || user?.hospital || 'Hospital';

  useEffect(() => {
    initializeHospitalData();
  }, []);

  const initializeHospitalData = async () => {
    console.log('🏥 Initializing hospital data...');
    setIsLoading(true);
    
    try {
      // Load hospital incidents
      await loadHospitalData();
      
      // Load hospital stats
      await loadHospitalStats();
      
      console.log('✅ Hospital data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading hospital data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHospitalData = async () => {
    try {
      const result = await HospitalService.getHospitalIncidents();
      
      if (result.success && result.data) {
        setIncomingIncidents(result.data.incoming || []);
        setAdmittedIncidents(result.data.admitted || []);
        setDischargedIncidents(result.data.discharged || []);
        
        console.log(`📊 Loaded incidents: Incoming=${result.data.incoming?.length || 0}, Admitted=${result.data.admitted?.length || 0}, Discharged=${result.data.discharged?.length || 0}`);
      }
    } catch (error) {
      console.error('❌ Error loading hospital incidents:', error);
    }
  };

  const loadHospitalStats = async () => {
    try {
      const result = await HospitalService.getHospitalStats();
      
      if (result.success && result.data) {
        setHospitalStats(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading hospital stats:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await Promise.all([loadHospitalData(), loadHospitalStats()]);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleViewDetails = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setDetailsDialog(true);
  };

  const handleAdmitPatient = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setAdmitForm({
      medicalNotes: incident.patientStatus?.medicalNotes || 'Patient admitted for treatment',
      treatment: incident.patientStatus?.treatment || 'Initial assessment and admission',
      doctor: incident.patientStatus?.doctor || `Dr. ${hospitalName}`,
      bedNumber: incident.patientStatus?.bedNumber || `${(admittedIncidents.length + 1).toString().padStart(2, '0')}`,
    });
    setAdmitDialog(true);
  };

  const handleDischargePatient = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setDischargeForm({
      medicalNotes: incident.patientStatus?.medicalNotes || 'Patient discharged after treatment',
      treatment: incident.patientStatus?.treatment || 'Completed treatment and recovery',
    });
    setDischargeDialog(true);
  };

  const confirmAdmitPatient = async () => {
    if (!selectedIncident) return;

    try {
      const result = await HospitalService.updateHospitalWorkflowStatus(
        selectedIncident.id,
        'admitted',
        admitForm.medicalNotes,
        admitForm.treatment,
        admitForm.doctor,
        admitForm.bedNumber
      );

      if (result.success) {
        await loadHospitalData();
        await loadHospitalStats();
        setAdmitDialog(false);
        setDetailsDialog(false);
      } else {
        console.error('❌ Failed to admit patient:', result.error);
      }
    } catch (error) {
      console.error('❌ Error admitting patient:', error);
    }
  };

  const confirmDischargePatient = async () => {
    if (!selectedIncident) return;

    try {
      const result = await HospitalService.updateHospitalWorkflowStatus(
        selectedIncident.id,
        'discharged',
        dischargeForm.medicalNotes,
        dischargeForm.treatment,
        admitForm.doctor || `Dr. ${hospitalName}`
      );

      if (result.success) {
        await loadHospitalData();
        await loadHospitalStats();
        setDischargeDialog(false);
        setDetailsDialog(false);
      } else {
        console.error('❌ Failed to discharge patient:', result.error);
      }
    } catch (error) {
      console.error('❌ Error discharging patient:', error);
    }
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchor(null);
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    handleFilterMenuClose();
  };

  // Filter incidents based on search and filter
  const getFilteredIncidents = (incidents: HospitalIncident[]) => {
    let filtered = incidents;

    if (searchQuery) {
      filtered = filtered.filter(incident =>
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reportedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(incident =>
        incident.priority?.toLowerCase() === selectedFilter ||
        incident.patientStatus?.condition?.toLowerCase() === selectedFilter
      );
    }

    return filtered;
  };

  const filteredIncoming = getFilteredIncidents(incomingIncidents);
  const filteredAdmitted = getFilteredIncidents(admittedIncidents);
  const filteredDischarged = getFilteredIncidents(dischargedIncidents);

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'incoming':
        return <Chip label="Incoming" color="warning" size="small" />;
      case 'admitted':
        return <Chip label="Admitted" color="primary" size="small" />;
      case 'discharged':
        return <Chip label="Discharged" color="success" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <Chip label="Urgent" color="error" size="small" />;
      case 'high':
        return <Chip label="High" color="warning" size="small" />;
      case 'medium':
        return <Chip label="Medium" color="info" size="small" />;
      case 'low':
        return <Chip label="Low" color="success" size="small" />;
      default:
        return <Chip label="Medium" color="default" size="small" />;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Statistics cards
  const statCards = [
    { 
      title: "Today's Admissions", 
      value: totalCases.toString(), 
      icon: <HospitalIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)'
    },
    { 
      title: "Incoming", 
      value: incomingCases.toString(), 
      icon: <AmbulanceIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)'
    },
    { 
      title: "Admitted", 
      value: admittedCases.toString(), 
      icon: <PersonIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)'
    },
    { 
      title: "Discharged", 
      value: dischargedCases.toString(), 
      icon: <CheckIcon sx={{ color: '#fff' }} />,
      color: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)'
    },
  ];

  // Render Discharged Patients Table
  const renderDischargedTable = () => {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Patient ID</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Discharge Date</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Condition</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Treatment</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDischarged.map((incident) => (
              <TableRow 
                key={incident.id}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {incident.id.substring(0, 8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(incident.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {incident.patientStatus?.condition || 'Not specified'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {incident.patientStatus?.treatment?.substring(0, 50) || 'No treatment specified'}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewDetails(incident)}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    View Record
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          backgroundColor: '#ffebeb',
          minHeight: '100vh',
          p: 3,
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }} textAlign="center">
          <Typography variant="h3" fontWeight={800} sx={{ color: '#111827' }}>
            HOSPITAL DASHBOARD
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {hospitalName} • Emergency notifications and patient management
          </Typography>
        </Box>

        {/* Emergency Alert */}
        {incomingCases > 0 && (
          <Alert 
            severity="warning" 
            icon={<NotificationIcon />} 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setTabValue(0)}>
                View All
              </Button>
            }
          >
            <Typography variant="h6">
              {incomingCases} Emergency {incomingCases === 1 ? 'Case' : 'Cases'} Incoming
            </Typography>
          </Alert>
        )}

        {/* Statistics Section */}
        <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
          {statCards.map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ 
                background: stat.color, 
                color: '#fff', 
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                }
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      borderRadius: '50%', 
                      p: 1.5, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6">{stat.title}</Typography>
                      <Typography variant="h3" fontWeight={700}>{stat.value}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <IconButton
                  onClick={handleNotificationMenuOpen}
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <Badge badgeContent={incomingCases} color="error">
                    <NotificationIcon />
                  </Badge>
                </IconButton>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshLoading}
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={handleFilterMenuOpen}
                  variant="outlined"
                  size="small"
                >
                  Filter
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs Section */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }
              }}
            >
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Incoming</span>
                    {incomingCases > 0 && (
                      <Badge 
                        badgeContent={incomingCases} 
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <AmbulanceIcon fontSize="small" />
                      </Badge>
                    )}
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Admitted</span>
                    {admittedCases > 0 && (
                      <Chip 
                        label={admittedCases} 
                        size="small" 
                        color="primary"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Discharged</span>
                    {dischargedCases > 0 && (
                      <Chip 
                        label={dischargedCases} 
                        size="small" 
                        color="success"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Incoming Tab */}
          <TabPanel value={tabValue} index={0}>
            {filteredIncoming.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <HospitalIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No incoming patients
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patients arriving from ambulance services will appear here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ p: 2 }}>
                {filteredIncoming.map((incident) => (
                  <Grid item xs={12} key={incident.id}>
                    <Card sx={{ 
                      borderRadius: 2,
                      bgcolor: incident.priority === 'urgent' ? '#ffebeb' : 'background.paper'
                    }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'error.main' }}>
                                <AmbulanceIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  Patient {incident.id.substring(0, 8)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {incident.description || 'Medical emergency'}
                                </Typography>
                                <Box display="flex" gap={1} mt={1}>
                                  {getStatusBadge(incident.hospitalStatus || 'incoming')}
                                  {getPriorityBadge(incident.priority || 'medium')}
                                  <Chip 
                                    label={`ETA: ${'Soon'}`} 
                                    color="warning" 
                                    size="small"
                                    icon={<TimerIcon />}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" justifyContent="flex-end" gap={1}>
                              <Button
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewDetails(incident)}
                                variant="outlined"
                                size="small"
                              >
                                Details
                              </Button>
                              <Button
                                startIcon={<AdmitIcon />}
                                onClick={() => handleAdmitPatient(incident)}
                                variant="contained"
                                color="error"
                                size="small"
                              >
                                Admit
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Admitted Tab */}
          <TabPanel value={tabValue} index={1}>
            {filteredAdmitted.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <MedicalIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No admitted patients
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patients currently admitted will appear here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ p: 2 }}>
                {filteredAdmitted.map((incident) => (
                  <Grid item xs={12} key={incident.id}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <MedicalIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  Patient {incident.id.substring(0, 8)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Bed {incident.patientStatus?.bedNumber || 'Not assigned'} • {incident.patientStatus?.doctor || 'No doctor assigned'}
                                </Typography>
                                <Box display="flex" gap={1} mt={1}>
                                  {getStatusBadge(incident.hospitalStatus || 'admitted')}
                                  {getPriorityBadge(incident.priority || 'medium')}
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" justifyContent="flex-end" gap={1}>
                              <Button
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewDetails(incident)}
                                variant="outlined"
                                size="small"
                              >
                                Details
                              </Button>
                              <Button
                                startIcon={<DischargeIcon />}
                                onClick={() => handleDischargePatient(incident)}
                                variant="contained"
                                color="secondary"
                                size="small"
                              >
                                Discharge
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Discharged Tab */}
          <TabPanel value={tabValue} index={2}>
            {filteredDischarged.length === 0 ? (
              <Box sx={{ p: 8, textAlign: "center" }}>
                <CheckIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No discharged patients
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discharged patients will appear here
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                {renderDischargedTable()}
              </Box>
            )}
          </TabPanel>
        </Paper>

        {/* Sidebar with Hospital Info */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={8}>
            {/* Recent Activity would go here */}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Department Status</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Emergency</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label="Active" color="success" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ICU</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={
                          hospitalStats.hospitalStats.find(s => s._id === 'icu')?.count ? 'Full' : 'Available'
                        } 
                        color={
                          hospitalStats.hospitalStats.find(s => s._id === 'icu')?.count ? 'error' : 'success'
                        } />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Surgery</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label="Limited" color="warning" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cardiology</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label="Active" color="success" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Emergency Admissions</Typography>
              <List dense>
                {incomingIncidents.slice(0, 3).map((incident) => (
                  <ListItem key={incident.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={`Patient ${incident.id.substring(0, 8)}`}
                      secondary={`${incident.description?.substring(0, 30) || 'Emergency'} - ${formatDate(incident.createdAt)}`}
                    />
                  </ListItem>
                ))}
                {incomingIncidents.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No recent emergency admissions
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Dialogs */}
        {/* Patient Details Dialog */}
        <PatientDetailsDialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          incident={selectedIncident}
          onAdmit={handleAdmitPatient}
          onDischarge={handleDischargePatient}
        />

        {/* Admit Patient Dialog */}
        <Dialog open={admitDialog} onClose={() => setAdmitDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AdmitIcon color="error" />
              <span>Admit Patient</span>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedIncident && (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {selectedIncident.patientStatus?.condition || 'Medical Emergency'}
                </Alert>
                <TextField
                  fullWidth
                  label="Assign Emergency Team"
                  value={admitForm.doctor}
                  onChange={(e) => setAdmitForm({...admitForm, doctor: e.target.value})}
                  sx={{ mb: 2 }}
                  placeholder="Team A - Dr. Smith"
                />
                <TextField
                  fullWidth
                  label="Prepare Room/Bed"
                  value={admitForm.bedNumber}
                  onChange={(e) => setAdmitForm({...admitForm, bedNumber: e.target.value})}
                  sx={{ mb: 2 }}
                  placeholder="Emergency Room 3"
                />
                <TextField
                  fullWidth
                  label="Treatment Plan"
                  multiline
                  rows={3}
                  value={admitForm.treatment}
                  onChange={(e) => setAdmitForm({...admitForm, treatment: e.target.value})}
                  sx={{ mb: 2 }}
                  placeholder="Initial assessment and admission"
                />
                <TextField
                  fullWidth
                  label="Medical Notes"
                  multiline
                  rows={3}
                  value={admitForm.medicalNotes}
                  onChange={(e) => setAdmitForm({...admitForm, medicalNotes: e.target.value})}
                  placeholder="Any special equipment or preparations..."
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdmitDialog(false)}>Cancel</Button>
            <Button onClick={confirmAdmitPatient} variant="contained" color="error">
              Confirm Admission
            </Button>
          </DialogActions>
        </Dialog>

        {/* Discharge Patient Dialog */}
        <Dialog open={dischargeDialog} onClose={() => setDischargeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <DischargeIcon color="secondary" />
              <span>Discharge Patient</span>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedIncident && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Are you sure you want to discharge Patient {selectedIncident.id.substring(0, 8)}?
                </Alert>
                <TextField
                  fullWidth
                  label="Final Medical Notes"
                  multiline
                  rows={3}
                  value={dischargeForm.medicalNotes}
                  onChange={(e) => setDischargeForm({...dischargeForm, medicalNotes: e.target.value})}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Completed Treatment"
                  value={dischargeForm.treatment}
                  onChange={(e) => setDischargeForm({...dischargeForm, treatment: e.target.value})}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDischargeDialog(false)}>Cancel</Button>
            <Button onClick={confirmDischargePatient} variant="contained" color="secondary">
              Confirm Discharge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={handleFilterMenuClose}
        >
          <MenuItem onClick={() => handleFilterSelect('all')}>All Patients</MenuItem>
          <MenuItem onClick={() => handleFilterSelect('urgent')}>Urgent Priority</MenuItem>
          <MenuItem onClick={() => handleFilterSelect('critical')}>Critical Condition</MenuItem>
          <MenuItem onClick={() => handleFilterSelect('stable')}>Stable Condition</MenuItem>
        </Menu>

        {/* Notification Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: { maxHeight: 400, width: 350 }
          }}
        >
          {incomingIncidents.length === 0 ? (
            <MenuItem>No new notifications</MenuItem>
          ) : (
            incomingIncidents.slice(0, 5).map((incident) => (
              <MenuItem key={incident.id} onClick={handleNotificationMenuClose}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <AmbulanceIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Patient ${incident.id.substring(0, 8)}`}
                  secondary={incident.description?.substring(0, 50) + '...'}
                />
              </MenuItem>
            ))
          )}
        </Menu>
      </Box>
    </Container>
  );
};

export default HospitalDashboard;