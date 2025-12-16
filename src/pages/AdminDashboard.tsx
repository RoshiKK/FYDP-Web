import React, { useState, useEffect } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  CircularProgress,
  Fab,
  Divider,
  LinearProgress,
  CardMedia,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Warning as DuplicateIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  SmartToy as AIIcon,
  Pending as PendingIcon,
  Block as BlockIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  GetApp as ExportIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  MedicalServices as MedicalIcon,
  Traffic as TrafficIcon,
  Public as PublicIcon,
  Assignment as TotalIcon,
  People as PeopleIcon,
  DoneAll as DoneAllIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as DepartmentIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

import {
  useAuth,
  type Incident,
  type DashboardStats,
  type User,
} from "../contexts/AuthContext";
import IncidentMap from "../components/IncidentMap";

// Date utilities
import { format, formatDistanceToNow, parseISO } from "date-fns";

// Add API URL constant from your second code
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Add getPhotoUrl function from your second code
const getPhotoUrl = (photo: any): string => {
  if (!photo) return "";

  console.log("📷 Processing photo:", photo);

  // If we have a direct URL, use it
  if (photo.url && typeof photo.url === "string") {
    console.log("📷 Using photo.url:", photo.url);
    return photo.url;
  }

  // If we have a filename, construct the URL from your backend structure
  if (photo.filename && typeof photo.filename === "string") {
    const url = `/api/upload/image/${photo.filename}`;
    console.log("📷 Generated URL from filename:", url);
    return url;
  }

  // If we have a GridFS file ID
  if (photo._id || photo.id) {
    const fileId = photo._id || photo.id;
    const url = `/api/upload/image/${fileId}`;
    console.log("📷 Generated URL from ID:", url);
    return url;
  }

  console.log("📷 No valid photo data found");
  return "";
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 4 }}>{children}</Box>}
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
  assigned: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#8B5CF6",
  cancelled: "#6B7280",
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Accident":
      return <TrafficIcon />;
    case "Medical Emergency":
      return <MedicalIcon />;
    default:
      return <PublicIcon />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <PendingIcon />;
    case "approved":
      return <ApproveIcon />;
    case "rejected":
      return <RejectIcon />;
    case "assigned":
      return <AssignmentTurnedInIcon />;
    case "in_progress":
      return <TimelineIcon />;
    case "completed":
      return <DoneAllIcon />;
    case "cancelled":
      return <CancelOutlinedIcon />;
    default:
      return <InfoIcon />;
  }
};

const getRoleColor = (role: string) => {
  const colors: { [key: string]: any } = {
    admin: "error",
    department: "primary",
    driver: "info",
    hospital: "success",
    citizen: "default",
    superadmin: "error",
  };
  return colors[role] || "default";
};

const getStatusColor = (status: string) => {
  const colors: { [key: string]: any } = {
    active: "success",
    inactive: "warning",
    suspended: "error",
  };
  return colors[status] || "default";
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "admin":
    case "superadmin":
      return <SecurityIcon />;
    case "department":
      return <DepartmentIcon />;
    case "driver":
      return <CarIcon />;
    case "hospital":
      return <HospitalIcon />;
    default:
      return <PersonIcon />;
  }
};

const StatCard = ({ title, value, icon, subtitle }: any) => (
  <Card
    sx={{
      background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
      color: "#fff",
      borderRadius: 3,
      height: "100%",
      display: "flex",
      alignItems: "center",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      px: 2,
      py: 2,
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
      },
    }}
  >
    <Avatar
      sx={{
        bgcolor: "rgba(255,255,255,0.12)",
        width: 56,
        height: 56,
        mr: 2,
      }}
    >
      {icon}
    </Avatar>
    <Box>
      <Typography variant="subtitle2" sx={{ opacity: 0.92, fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Card>
);

const IncidentCard = ({
  incident,
  onView,
  onApprove,
  onReject,
  selected = false,
  onSelect,
}: any) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        background: "#fff",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 320,
        border: selected ? "2px solid #3B82F6" : "none",
        boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
          transform: "translateY(-6px)",
        },
      }}
      onClick={() => onSelect && onSelect(incident._id)}
    >
      <CardContent
        sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box sx={{ pr: 1, minWidth: 0 }}>
            <Typography
              noWrap
              variant="subtitle2"
              sx={{ color: "#6b7280", fontWeight: 600 }}
            >
              {incident.reportedBy?.name || "Unknown"}
            </Typography>
            <Typography noWrap variant="caption" sx={{ color: "#9ca3af" }}>
              {incident.reportedBy?.email || ""} •{" "}
              {incident.reportedBy?.phone || ""}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center" flexShrink={0}>
            {incident.aiDetectionScore && (
              <Chip
                icon={<AIIcon sx={{ color: "#b91c1c !important" }} />}
                label={`AI ${incident.aiDetectionScore}%`}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "#f87171",
                  color: "#b91c1c",
                  fontWeight: 700,
                  background: "rgba(255,0,0,0.04)",
                }}
              />
            )}
            {incident.similarIncidents && incident.similarIncidents > 0 && (
              <Chip
                icon={<DuplicateIcon />}
                label="Possible Duplicate"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "#111827",
            fontWeight: 700,
            lineHeight: 1.35,
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            minHeight: "3.6em",
          }}
        >
          {incident.description || "No description"}
        </Typography>

        <Box sx={{ mt: "auto" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar
              sx={{
                bgcolor: "#fff0f0",
                color: "#991b1b",
                width: 32,
                height: 32,
              }}
            >
              <LocationIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" color="text.secondary" noWrap>
              {incident.location?.address || "Unknown location"}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: "#fff0f0",
                color: "#991b1b",
                width: 32,
                height: 32,
              }}
            >
              <AccessTimeIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(parseISO(incident.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Box
        sx={{
          p: 2,
          pt: 0,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onView(incident);
          }}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          View
        </Button>
        {incident.status === "pending" && (
          <>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onApprove(incident);
              }}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<RejectIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onReject(incident);
              }}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Reject
            </Button>
          </>
        )}
      </Box>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  const {
    getAdminDashboardData,
    getAdminIncidents,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    restrictUser,
    getUserStats,
    rejectIncident,
    bulkRejectIncidents,
  } = useAuth();

  // State management
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [, setDashboardData] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [assignDepartment, setAssignDepartment] = useState("");
  const [restrictDays, setRestrictDays] = useState(7);
  const [] = useState<null | HTMLElement>(
    null
  );
  const [selectedActionUser, setSelectedActionUser] = useState<User | null>(
    null
  );
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    pendingIncidents: 0,
    approvedIncidents: 0,
    completedIncidents: 0,
    avgResponseTime: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const [userStats, setUserStats] = useState<any>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    role: "citizen",
    department: "",
    hospital: "",
    ambulanceService: "",
    drivingLicense: "",
    status: "active",
  });

  // User Management States
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<User | null>(
    null
  );

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load dashboard data
      const dashboardResult = await getAdminDashboardData();
      setDashboardData(dashboardResult);
      setStats(dashboardResult.overview);

      // Load incidents
      const incidentsResult = await getAdminIncidents();
      setIncidents(incidentsResult.data || []);

      // Load users
      const usersList = await getUsers();
      setUsers(usersList);

      // Load user stats
      const statsResult = await getUserStats();
      setUserStats(statsResult);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      showSnackbar(`Error loading data: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadDashboardData();
      showSnackbar("Dashboard refreshed successfully", "success");
    } catch (error: any) {
      showSnackbar(`Error refreshing: ${error.message}`, "error");
    }
  };

  const handleApprove = async (incident: Incident) => {
    try {
      setSelectedIncident(incident);
      setAssignDialogOpen(true);
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, "error");
    }
  };

  const handleReject = async (incident: Incident) => {
    setSelectedIncident(incident);
    setRejectDialogOpen(true);
  };

  const handleBulkAction = (action: string) => {
    if (selectedIncidents.length === 0) {
      showSnackbar("No incidents selected", "warning");
      return;
    }

    switch (action) {
      case "approve":
        setAssignDialogOpen(true);
        break;
      case "reject":
        setRejectDialogOpen(true);
        break;
      case "assign":
        setAssignDialogOpen(true);
        break;
      case "clear":
        setSelectedIncidents([]);
        break;
    }
    setBulkMenuAnchor(null);
  };

  const handleIncidentSelect = (incidentId: string) => {
    setSelectedIncidents((prev) =>
      prev.includes(incidentId)
        ? prev.filter((id) => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // ========== INCIDENT APPROVE/ASSIGN FUNCTIONS ==========

  const confirmApprove = async () => {
  if (!selectedIncident) {
    showSnackbar("No incident selected", "warning");
    return;
  }
  
  if (!assignDepartment) {
    showSnackbar("Please select a department", "warning");
    return;
  }

  try {
    console.log("Approving incident:", selectedIncident._id);
    console.log("Assigning to department:", assignDepartment);

    const incidentIds =
      selectedIncidents.length > 0
        ? selectedIncidents
        : [selectedIncident._id];

    if (selectedIncidents.length > 0) {
      // Bulk approve
      showSnackbar(
        `${incidentIds.length} incidents approved and assigned to ${assignDepartment}`,
        "success"
      );
    } else {
      // Single approve
      showSnackbar(
        `Incident approved and assigned to ${assignDepartment}`,
        "success"
      );
    }

    await loadDashboardData();
    
    // CLOSE BOTH DIALOGS
    setAssignDialogOpen(false);
    setViewDialogOpen(false); // This closes the view details dialog
    setAssignDepartment("");
    setSelectedIncidents([]);
    
  } catch (error: any) {
    console.error("Error approving incident:", error);
    showSnackbar(`Error: ${error.message}`, "error");
  }
};

  const confirmReject = async () => {
  if (!selectedIncident || !rejectReason) {
    showSnackbar("Please provide a rejection reason", "warning");
    return;
  }

  try {
    const incidentIds =
      selectedIncidents.length > 0
        ? selectedIncidents
        : [selectedIncident._id];

    if (selectedIncidents.length > 0) {
      await bulkRejectIncidents(incidentIds, rejectReason);
      showSnackbar(`${incidentIds.length} incidents rejected`, "success");
    } else {
      await rejectIncident(selectedIncident._id, rejectReason);
      showSnackbar("Incident rejected", "success");
    }

    await loadDashboardData();
    
    // Close both dialogs
    setRejectDialogOpen(false);
    setViewDialogOpen(false); // Close view details dialog
    setRejectReason("");
    setSelectedIncidents([]);
  } catch (error: any) {
    showSnackbar(`Error: ${error.message}`, "error");
  }
};

  const confirmBulkAssign = async () => {
  if (!assignDepartment) {
    showSnackbar("Please select a department", "warning");
    return;
  }
  
  if (selectedIncidents.length === 0) {
    showSnackbar("No incidents selected", "warning");
    return;
  }

  try {
    
    showSnackbar(
      `${selectedIncidents.length} incidents assigned to ${assignDepartment}`,
      "success"
    );
    
    await loadDashboardData();
    
    // CLOSE THE ASSIGN DIALOG
    setAssignDialogOpen(false);
    setAssignDepartment("");
    setSelectedIncidents([]);
    
    // Also close view dialog if it's open
    if (viewDialogOpen) {
      setViewDialogOpen(false);
    }
    
  } catch (error: any) {
    console.error("Error bulk assigning incidents:", error);
    showSnackbar(`Error: ${error.message}`, "error");
  }
};

  // ========== USER MANAGEMENT FUNCTIONS ==========

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      ...user,
      id: user._id || user.id,
    });
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await deleteUser(userId);
        showSnackbar("User deleted successfully", "success");
        await loadDashboardData();
      } catch (error: any) {
        showSnackbar(`Error deleting user: ${error.message}`, "error");
      }
    }
  };

  const handleRestrictUser = async (userId: string, days: number) => {
    try {
      await restrictUser(userId, days, "Manual restriction by admin");
      showSnackbar(`User restricted for ${days} days`, "success");
      await loadDashboardData();
      setRestrictDialogOpen(false);
    } catch (error: any) {
      showSnackbar(`Error restricting user: ${error.message}`, "error");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser.id) return;

    try {
      await updateUser(editingUser.id, editingUser);
      showSnackbar("User updated successfully", "success");
      setEditUserDialogOpen(false);
      setEditingUser({});
      await loadDashboardData();
    } catch (error: any) {
      showSnackbar(`Error updating user: ${error.message}`, "error");
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (!newUser.name || !newUser.email || !newUser.phone) {
        showSnackbar("Please fill all required fields", "warning");
        return;
      }

      const createdUser = await createUser(newUser);
      showSnackbar(`User ${createdUser.name} created successfully`, "success");
      setUserDialogOpen(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "citizen",
        department: "",
        hospital: "",
        ambulanceService: "",
        drivingLicense: "",
        status: "active",
      });
      await loadDashboardData();
    } catch (error: any) {
      showSnackbar(`Error creating user: ${error.message}`, "error");
    }
  };

  const handleUserMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setUserMenuAnchor(event.currentTarget);
    setSelectedUserForMenu(user);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setSelectedUserForMenu(null);
  };

  const handleUserMenuAction = (action: string) => {
    if (!selectedUserForMenu) return;

    switch (action) {
      case "view":
        handleViewUserDetails(selectedUserForMenu);
        break;
      case "edit":
        handleEditUser(selectedUserForMenu);
        break;
      case "delete":
        handleDeleteUser(selectedUserForMenu._id || selectedUserForMenu.id);
        break;
      case "restrict":
        setSelectedActionUser(selectedUserForMenu);
        setRestrictDialogOpen(true);
        break;
    }
    handleUserMenuClose();
  };

  const filteredIncidents = incidents;
  const pendingIncidents = filteredIncidents.filter(
    (inc) => inc.status === "pending"
  );
  const processedIncidents = filteredIncidents.filter(
    (inc) => inc.status !== "pending"
  );

  const statCards = [
    {
      title: "Total Reports",
      value: stats.totalIncidents,
      icon: <TotalIcon fontSize="large" />,
    },
    {
      title: "Pending Review",
      value: stats.pendingIncidents,
      icon: <PendingIcon fontSize="large" />,
    },
    {
      title: "Approved",
      value: stats.approvedIncidents,
      icon: <ApproveIcon fontSize="large" />,
    },
    {
      title: "Completed",
      value: stats.completedIncidents,
      icon: <DoneAllIcon fontSize="large" />,
    },
    {
      title: "Active Users",
      value: userStats?.total?.activeUsers || 0,
      icon: <PeopleIcon fontSize="large" />,
    },
  ];

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 6,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ffe5e5 0%, #fef2f2 100%)",
      }}
    >
      {/* Header */}
      <Box mb={6} textAlign="center">
        <Typography variant="h3" fontWeight={800} sx={{ color: "#111827" }}>
          ADMIN DASHBOARD
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review and manage incident reports with AI-powered assistance
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 5,
          alignItems: "stretch",
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {statCards.map((stat, index) => (
          <Box key={index} sx={{ flex: "1 1 0", minWidth: 180 }}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} />
          </Box>
        ))}
      </Box>

      {/* Tabs for different views */}
      <Paper
        sx={{
          width: "100%",
          mb: 4,
          borderRadius: 3,
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ "& .MuiTab-root": { fontSize: "1.1rem", fontWeight: 600 } }}
        >
          <Tab label={`Pending Review (${pendingIncidents.length})`} />
          <Tab label={`Processed (${processedIncidents.length})`} />
          <Tab label={`Map View (${incidents.length})`} />
          <Tab label="User Management" />
        </Tabs>
      </Paper>

      {/* Pending Review Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Alert Banner */}
        {stats.pendingIncidents > 5 && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small">
                View All
              </Button>
            }
          >
            <Typography fontWeight={600}>
              High Priority Alert: {stats.pendingIncidents} incidents awaiting
              review
            </Typography>
          </Alert>
        )}

        {/* Bulk Actions Bar */}
        {selectedIncidents.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "#dbeafe" }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleOutlineIcon sx={{ color: "#1d4ed8" }} />
                <Box>
                  <Typography fontWeight={600} color="#1e40af">
                    {selectedIncidents.length} incidents selected
                  </Typography>
                  <Typography variant="body2" color="#3b82f6">
                    Choose an action to perform on all selected incidents
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleBulkAction("approve")}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => handleBulkAction("reject")}
                >
                  Reject Selected
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DepartmentIcon />}
                  onClick={() => handleBulkAction("assign")}
                >
                  Assign Department
                </Button>
                <IconButton onClick={(e) => setBulkMenuAnchor(e.currentTarget)}>
                  <MoreIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        <Grid container spacing={3} alignItems="stretch">
          {pendingIncidents.map((incident) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={incident._id}
              sx={{ display: "flex" }}
            >
              <IncidentCard
                incident={incident}
                onView={() => {
                  setSelectedIncident(incident);
                  setViewDialogOpen(true);
                }}
                onApprove={() => handleApprove(incident)}
                onReject={() => handleReject(incident)}
                selected={selectedIncidents.includes(incident._id)}
                onSelect={handleIncidentSelect}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Processed Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Description
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Department
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Reported By
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedIncidents.map((incident) => (
                <TableRow key={incident._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {incident._id?.substring(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 300 }}>
                      {incident.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.category}
                      size="small"
                      icon={getCategoryIcon(incident.category)}
                    />
                  </TableCell>
                  <TableCell>
                    {incident.assignedTo?.department || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status}
                      size="small"
                      sx={{
                        bgcolor: `${
                          statusColors[incident.status] || "#6B7280"
                        }20`,
                        color: statusColors[incident.status] || "#6B7280",
                        fontWeight: 600,
                      }}
                      icon={getStatusIcon(incident.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {incident.reportedBy?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(incident.createdAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setAssignDialogOpen(true);
                        setViewDialogOpen(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Map View Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper
          sx={{
            height: "calc(100vh - 300px)",
            minHeight: 600,
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
          }}
        >
          <IncidentMap
            incidents={incidents}
            onIncidentClick={(incident) => {
              setSelectedIncident(incident);
              setViewDialogOpen(true);
            }}
            initialCenter={[24.8607, 67.0011]} // Karachi coordinates
            initialZoom={12}
          />
        </Paper>

        {/* Map Statistics */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Incident Distribution by Area
              </Typography>
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  Spatial analysis coming soon
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Response Time Heatmap
              </Typography>
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  Response time visualization coming soon
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* User Management Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: "#111827" }}>
              User Management
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton>
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setUserDialogOpen(true)}
                sx={{
                  background:
                    "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  color: "white",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                  },
                }}
              >
                Add User
              </Button>
            </Box>
          </Box>

          {users.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary" gutterBottom>
                No users found
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      User
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Phone Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Organization
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Last Login
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: getRoleColor(user.role),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getRoleIcon(user.role)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {user.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {user._id?.substring(0, 8)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.department ||
                            user.hospital ||
                            user.ambulanceService ||
                            "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.lastLogin
                            ? formatDistanceToNow(parseISO(user.lastLogin), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUserDetails(user)}
                              sx={{ color: "#3B82F6" }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                              sx={{ color: "#10B981" }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleUserMenuOpen(e, user)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
          },
        }}
        onClick={handleRefresh}
      >
        <RefreshIcon />
      </Fab>

      {/* Dialogs */}
      {/* View Incident Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Incident Details</Typography>
            {selectedIncident && (
              <Chip
                label={selectedIncident.status}
                size="small"
                sx={{
                  bgcolor: `${
                    statusColors[selectedIncident.status] || "#6B7280"
                  }20`,
                  color: statusColors[selectedIncident.status] || "#6B7280",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedIncident.description || "No description"}
                  </Typography>
                  
                  {/* Added Photo Display Section */}
                  {selectedIncident.photos && selectedIncident.photos.length > 0 ? (
                    <Box sx={{ mt: 2, mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Photos ({selectedIncident.photos.length}):
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedIncident.photos.map((photo, index) => {
                          // Get the URL using our helper function
                          const photoUrl = getPhotoUrl(photo);

                          // Construct the full URL
                          const fullUrl = photoUrl
                            ? photoUrl.startsWith("http")
                              ? photoUrl
                              : `${API_URL}${photoUrl}`
                            : "";

                          console.log(`📷 Photo ${index} full URL:`, fullUrl);

                          return (
                            <Grid item xs={4} key={index}>
                              {fullUrl ? (
                                <Box sx={{ position: "relative" }}>
                                  <CardMedia
                                    component="img"
                                    height="140"
                                    image={fullUrl}
                                    alt={
                                      photo.originalName ||
                                      `Incident photo ${index + 1}`
                                    }
                                    sx={{
                                      borderRadius: 1,
                                      objectFit: "cover",
                                      width: "100%",
                                    }}
                                    onError={(e) => {
                                      console.error(
                                        `❌ Failed to load image ${index}:`,
                                        fullUrl
                                      );
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";

                                      // Show error placeholder
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const errorDiv =
                                          document.createElement("div");
                                        errorDiv.style.cssText = `
                                          height: 140px;
                                          display: flex;
                                          flex-direction: column;
                                          align-items: center;
                                          justify-content: center;
                                          background-color: #ffebee;
                                          border: 1px solid #ffcdd2;
                                          border-radius: 4px;
                                          padding: 8px;
                                          text-align: center;
                                        `;
                                        errorDiv.innerHTML = `
                                          <div style="color: #d32f2f; font-size: 14px; margin-bottom: 4px;">⚠️ Image failed to load</div>
                                          <div style="color: #757575; font-size: 12px;">${
                                            photo.filename || "Unknown file"
                                          }</div>
                                        `;
                                        parent.appendChild(errorDiv);
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log(
                                        `✅ Successfully loaded image ${index}:`,
                                        fullUrl
                                      );
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Paper
                                  sx={{
                                    height: 140,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "column",
                                    borderRadius: 1,
                                    bgcolor: "#f5f5f5",
                                    p: 2,
                                  }}
                                >
                                  <Typography
                                    color="text.secondary"
                                    variant="body2"
                                    align="center"
                                  >
                                    No Image URL
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    align="center"
                                  >
                                    {photo.filename || "No filename"}
                                  </Typography>
                                </Paper>
                              )}
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        mt: 2,
                        mb: 3,
                        p: 2,
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        No photos available for this incident
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reported By
                  </Typography>
                  <Typography variant="body1">
                    {selectedIncident.reportedBy?.name || "Unknown"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedIncident.reportedBy?.email} •{" "}
                    {selectedIncident.reportedBy?.phone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {selectedIncident.location?.address || "Unknown location"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip
                    label={selectedIncident.category}
                    icon={getCategoryIcon(selectedIncident.category)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      parseISO(selectedIncident.createdAt),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      parseISO(selectedIncident.updatedAt),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </Typography>
                </Grid>
                {selectedIncident.assignedTo && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {selectedIncident.assignedTo.department}
                      </Typography>
                      {selectedIncident.assignedTo.driverName && (
                        <Typography variant="body2" color="text.secondary">
                          • Driver: {selectedIncident.assignedTo.driverName}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
                {selectedIncident.aiDetectionScore && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      AI Detection Score
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedIncident.aiDetectionScore}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        color={
                          selectedIncident.aiDetectionScore >= 80
                            ? "success"
                            : "warning"
                        }
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {selectedIncident.aiDetectionScore}%
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Close
          </Button>
          {selectedIncident?.status === "pending" && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleApprove(selectedIncident)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleReject(selectedIncident)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Assign Department Dialog */}
      <Dialog
  open={assignDialogOpen}
  onClose={() => {
    setAssignDialogOpen(false);
    setAssignDepartment("");
  }}
  PaperProps={{
    sx: {
      borderRadius: 3,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    },
  }}
>
  <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
    {selectedIncidents.length > 0
      ? `Assign ${selectedIncidents.length} Selected Incidents`
      : "Assign Department"}
  </DialogTitle>
  <DialogContent>
    <Typography gutterBottom sx={{ mb: 2 }}>
      {selectedIncidents.length > 0
        ? `Select department for ${selectedIncidents.length} incidents:`
        : `Select department for incident:`}
    </Typography>
    <FormControl fullWidth>
      <InputLabel>Select Department *</InputLabel>
      <Select
        value={assignDepartment}
        label="Select Department *"
        onChange={(e) => setAssignDepartment(e.target.value)}
        required
      >
        <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
        <MenuItem value="Chippa Ambulance">Chippa Ambulance</MenuItem>
      </Select>
    </FormControl>
    {selectedIncidents.length > 0 && (
      <Alert severity="info" sx={{ mt: 2 }}>
        This will assign all {selectedIncidents.length} selected incidents
        to {assignDepartment}.
      </Alert>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 3 }}>
    <Button
      onClick={() => {
        setAssignDialogOpen(false);
        setAssignDepartment("");
      }}
      sx={{
        color: "#64748B",
        fontWeight: 600,
        borderRadius: "12px",
        "&:hover": {
          backgroundColor: "rgba(100, 116, 139, 0.08)",
        },
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={
        selectedIncidents.length > 0 ? confirmBulkAssign : confirmApprove
      }
      color="primary"
      variant="contained"
      disabled={!assignDepartment}
      sx={{
        borderRadius: "12px",
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1,
      }}
    >
      {selectedIncidents.length > 0
        ? `Assign to ${assignDepartment}`
        : "Approve & Assign"}
    </Button>
  </DialogActions>
</Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectReason("");
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          {selectedIncidents.length > 0
            ? "Reject Selected Incidents"
            : "Reject Incident"}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {selectedIncidents.length > 0
              ? `Please provide a reason for rejecting ${selectedIncidents.length} incidents:`
              : `Please provide a reason for rejecting incident ${selectedIncident?._id?.substring(
                  0,
                  8
                )}:`}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectReason("");
            }}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmReject}
            color="error"
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog
        open={viewUserDialogOpen}
        onClose={() => setViewUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          User Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getRoleColor(selectedUser.role),
                    fontSize: "2rem",
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      label={selectedUser.role}
                      color={getRoleColor(selectedUser.role)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={selectedUser.status}
                      color={getStatusColor(selectedUser.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.phone || "Not provided"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    CNIC
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.cnic || "Not provided"}
                  </Typography>
                </Grid>

                {selectedUser.department && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.department}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.hospital && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hospital
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.hospital}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.ambulanceService && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Ambulance Service
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.ambulanceService}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.drivingLicense && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Driving License
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.drivingLicense}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(
                      parseISO(selectedUser.createdAt),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.lastLogin
                      ? formatDistanceToNow(parseISO(selectedUser.lastLogin), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </Typography>
                </Grid>

                {selectedUser.restrictionEndDate && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="body2">
                        Restricted until:{" "}
                        {format(
                          parseISO(selectedUser.restrictionEndDate),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setViewUserDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editUserDialogOpen}
        onClose={() => {
          setEditUserDialogOpen(false);
          setEditingUser({});
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Edit User: {editingUser.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editingUser.name || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingUser.email || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editingUser.phone || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNIC"
                value={editingUser.cnic || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, cnic: e.target.value })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingUser.role || "citizen"}
                  label="Role"
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as User["role"],
                    })
                  }
                >
                  <MenuItem value="citizen">Citizen</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingUser.status || "active"}
                  label="Status"
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      status: e.target.value as User["status"],
                    })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Role-specific fields */}
            {(editingUser.role === "driver" ||
              editingUser.role === "department") && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={editingUser.department || ""}
                    label="Department"
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        department: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
                    <MenuItem value="Chippa Ambulance">
                      Chippa Ambulance
                    </MenuItem>
                    <MenuItem value="Rescue 1122">Rescue 1122</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {editingUser.role === "driver" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ambulance Service"
                    value={editingUser.ambulanceService || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        ambulanceService: e.target.value,
                      })
                    }
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driving License"
                    value={editingUser.drivingLicense || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        drivingLicense: e.target.value,
                      })
                    }
                    margin="normal"
                  />
                </Grid>
              </>
            )}

            {editingUser.role === "hospital" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hospital"
                  value={editingUser.hospital || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, hospital: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
            )}

            {/* Password reset section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Password Management
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="New Password (Leave empty to keep current)"
                margin="normal"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setEditUserDialogOpen(false);
              setEditingUser({});
            }}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
              color: "white",
              borderRadius: "12px",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Create New User
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name *"
                fullWidth
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email *"
                fullWidth
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone *"
                fullWidth
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role *"
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as any })
                  }
                >
                  <MenuItem value="citizen">Citizen</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(newUser.role === "driver" || newUser.role === "department") && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newUser.department}
                    label="Department"
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                  >
                    <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
                    <MenuItem value="Chippa Ambulance">
                      Chippa Ambulance
                    </MenuItem>
                    <MenuItem value="Rescue 1122">Rescue 1122</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {newUser.role === "driver" && (
              <Grid item xs={12}>
                <TextField
                  label="Ambulance Service"
                  fullWidth
                  value={newUser.ambulanceService}
                  onChange={(e) =>
                    setNewUser({ ...newUser, ambulanceService: e.target.value })
                  }
                />
              </Grid>
            )}
            {newUser.role === "hospital" && (
              <Grid item xs={12}>
                <TextField
                  label="Hospital Name"
                  fullWidth
                  value={newUser.hospital}
                  onChange={(e) =>
                    setNewUser({ ...newUser, hospital: e.target.value })
                  }
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setUserDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
              color: "white",
              borderRadius: "12px",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              },
            }}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restrict User Dialog */}
      <Dialog
        open={restrictDialogOpen}
        onClose={() => setRestrictDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Restrict User Access
        </DialogTitle>
        <DialogContent>
          {selectedActionUser && (
            <>
              <Typography gutterBottom>
                Restrict user <strong>{selectedActionUser.name}</strong> for:
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Restriction Period</InputLabel>
                <Select
                  value={restrictDays}
                  onChange={(e) => setRestrictDays(Number(e.target.value))}
                  label="Restriction Period"
                >
                  <MenuItem value={1}>1 Day</MenuItem>
                  <MenuItem value={7}>7 Days</MenuItem>
                  <MenuItem value={30}>30 Days</MenuItem>
                  <MenuItem value={90}>90 Days</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="warning" sx={{ mt: 2 }}>
                User will not be able to login during the restriction period.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setRestrictDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedActionUser) {
                handleRestrictUser(
                  selectedActionUser._id || selectedActionUser.id,
                  restrictDays
                );
              }
            }}
            variant="contained"
            color="warning"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Restrict User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkAction("approve")}>
          <ListItemIcon>
            <ApproveIcon fontSize="small" />
          </ListItemIcon>
          Approve Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("reject")}>
          <ListItemIcon>
            <RejectIcon fontSize="small" />
          </ListItemIcon>
          Reject Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("assign")}>
          <ListItemIcon>
            <DepartmentIcon fontSize="small" />
          </ListItemIcon>
          Assign Department
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction("clear")}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Clear Selection
        </MenuItem>
      </Menu>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleUserMenuAction("view")}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuAction("edit")}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuAction("restrict")}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          Restrict User
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedUserForMenu) {
              handleUserMenuAction("delete");
            }
          }}
          sx={{ color: "#DC2626" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete User
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;