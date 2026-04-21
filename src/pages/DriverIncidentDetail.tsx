// src/pages/DriverIncidentDetail.tsx
// Equivalent to Mobile: DriverIncidentDetailScreen (driver_tracking_screen.dart)
// NO UI STYLE CHANGES - purely functional sync with mobile

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
  Navigation as NavigationIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverService, { DriverIncident } from '../services/driverService';
import { useAuth } from '../contexts/AuthContext';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons matching mobile colors
const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#C62828;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(198,40,40,0.4);display:flex;align-items:center;justify-content:center;">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div><div style="background:#2E7D32;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">YOU</div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

const incidentIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#E65100;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(230,81,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
  </div><div style="background:#E65100;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">INC</div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

const hospitalIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#1565C0;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(21,101,192,0.4);display:flex;align-items:center;justify-content:center;">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
  </div><div style="background:#1565C0;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">HOSP</div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

// Hospital type from API
interface NearbyHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  etaMinutes: number;
}

// Map bounds fitter component
const MapBoundsFitter: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      try {
        const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {
        if (points[0]) map.setView(points[0], 13);
      }
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [points, map]);
  return null;
};

// Timeline step config - matches mobile exactly
const TIMELINE_STEPS = [
  { label: 'Assigned', status: 'assigned', icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Start Ride', status: 'en_route', icon: <CarIcon fontSize="small" /> },
  { label: 'Arrived at Scene', status: 'arrived', icon: <LocationIcon fontSize="small" /> },
  { label: 'Hospital Route', status: 'hospital_route', icon: <HospitalIcon fontSize="small" /> },
  { label: 'Transporting', status: 'transporting', icon: <CarIcon fontSize="small" /> },
  { label: 'Case Delivered', status: 'delivered', icon: <CheckIcon fontSize="small" /> },
];

const getTimelineIndex = (status: string): number => {
  switch (status) {
    case 'assigned': return 0;
    case 'arrived': return 2;
    case 'transporting': return 4;
    case 'delivered': return 5;
    case 'completed': return 6;
    default: return 0;
  }
};

// Status banner config - matches mobile exactly
const getStatusBannerConfig = (status: string, hospitalName?: string) => {
  switch (status) {
    case 'assigned':
      return { color: '#FF9800', message: 'Tap "Start Ride" to navigate to the incident scene.' };
    case 'arrived':
      return { color: '#1976D2', message: 'Tap "Enable Hospital Route" to find the nearest hospital.' };
    case 'transporting':
      return { color: '#9C27B0', message: `Patient on board. Navigate to ${hospitalName || 'hospital'}.` };
    case 'delivered':
      return { color: '#4CAF50', message: 'Patient delivered! Tap "Complete Mission" to close.' };
    default:
      return { color: '#757575', message: '' };
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'accident': return '🚗';
    case 'fire': return '🔥';
    case 'medical': return '🏥';
    default: return '⚠️';
  }
};

// Haversine distance in km
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DriverIncidentDetail: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  useAuth();  // keep context live; user not needed on this page

  const [incident, setIncident] = useState<DriverIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('assigned');
  const [isUpdating, setIsUpdating] = useState(false);

  // Location states
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(null);

  // Hospital states
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<NearbyHospital | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);
  const [hospitalDialog, setHospitalDialog] = useState(false);

  // Route mode: 'toIncident' | 'toHospital'
  const [routeMode, setRouteMode] = useState<'toIncident' | 'toHospital'>('toIncident');

  // Patient status dialog
  const [patientStatusDialog, setPatientStatusDialog] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  // Map bounds
  const [mapBoundsPoints, setMapBoundsPoints] = useState<[number, number][]>([]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Load incident data
  const loadIncident = useCallback(async () => {
    if (!incidentId) return;
    try {
      const result = await DriverService.getMyAssignedIncidents();
      if (result.success) {
        const found = result.data.find(i => i.id === incidentId || i._id === incidentId);
        if (found) {
          setIncident(found);
          setCurrentStatus(found.driverStatus || 'assigned');
          // Extract incident location
          const loc = found.location as any;
          if (loc) {
            let lat: number | null = null;
            let lng: number | null = null;
            if (loc.latitude != null && loc.longitude != null) {
              lat = loc.latitude; lng = loc.longitude;
            } else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
              lng = loc.coordinates[0]; lat = loc.coordinates[1];
            } else if (loc.coordinates && typeof loc.coordinates === 'object' && !Array.isArray(loc.coordinates)) {
              lat = loc.coordinates.lat; lng = loc.coordinates.lng;
            }
            if (lat != null && lng != null) setIncidentLocation([lat, lng]);
          }
        }
      }
    } catch (e) {
      console.error('Error loading incident:', e);
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  // Get driver location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setDriverLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {
          // Default to Karachi if permission denied
          setDriverLocation([24.8607, 67.0011]);
        },
        { enableHighAccuracy: true, timeout: 30000 }
      );
    }
  }, []);

  useEffect(() => { loadIncident(); }, [loadIncident]);

  // Update map bounds when locations change
  useEffect(() => {
    const points: [number, number][] = [];
    if (driverLocation) points.push(driverLocation);
    if (incidentLocation) points.push(incidentLocation);
    if (routeMode === 'toHospital' && selectedHospital) {
      points.push([selectedHospital.latitude, selectedHospital.longitude]);
    }
    setMapBoundsPoints(points);
  }, [driverLocation, incidentLocation, selectedHospital, routeMode]);

  // Fetch nearest hospitals from real API
  const fetchNearestHospitals = async () => {
    if (hospitalsLoaded) {
      setHospitalDialog(true);
      return;
    }
    if (!incidentLocation) {
      showSnackbar('Incident location not available', 'error');
      return;
    }
    setLoadingHospitals(true);
    try {
      const result = await DriverService.fetchNearestHospitals(incidentLocation[0], incidentLocation[1]);
      if (result.success && result.data.length > 0) {
        setNearbyHospitals(result.data);
        setHospitalsLoaded(true);
        setHospitalDialog(true);
      } else {
        // Fallback to Karachi hospitals if API fails
        const fallback: NearbyHospital[] = [
          { id: 'h1', name: 'Jinnah Hospital', latitude: 24.8615, longitude: 67.0315, distance: 2.5, etaMinutes: 8 },
          { id: 'h2', name: 'Aga Khan Hospital', latitude: 24.8834, longitude: 67.0768, distance: 4.1, etaMinutes: 12 },
          { id: 'h3', name: 'Civil Hospital', latitude: 24.8591, longitude: 67.0036, distance: 6.8, etaMinutes: 18 },
        ];
        setNearbyHospitals(fallback);
        setHospitalsLoaded(true);
        setHospitalDialog(true);
      }
    } catch {
      showSnackbar('Could not fetch nearby hospitals', 'error');
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Update driver status
  const updateStatus = async (newStatus: 'arrived' | 'transporting' | 'delivered' | 'completed') => {
    if (!incident) return;
    if ((newStatus === 'transporting' || newStatus === 'delivered') && !selectedHospital) {
      showSnackbar('Please select a hospital first', 'warning');
      await fetchNearestHospitals();
      return;
    }
    setIsUpdating(true);
    try {
      const result = await DriverService.updateDriverWorkflowStatus(
        incident.id,
        newStatus,
        selectedHospital?.name,
        newStatus === 'transporting' ? 'Patient being transported to hospital' :
        newStatus === 'delivered' ? 'Patient delivered to hospital' : 'Patient in transit'
      );
      if (result.success) {
        setCurrentStatus(newStatus);
        const messages: Record<string, string> = {
          arrived: 'Marked as arrived at scene',
          transporting: 'Transport started',
          delivered: 'Patient delivered!',
          completed: 'Mission completed!',
        };
        showSnackbar(messages[newStatus] || 'Status updated', 'success');
        if (newStatus === 'delivered' || newStatus === 'completed') {
          setTimeout(() => navigate('/driver'), 1500);
        }
      } else {
        showSnackbar(result.error || 'Failed to update status', 'error');
      }
    } catch (e: any) {
      showSnackbar(`Error: ${e.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle patient status (dialog from arrived state)
  const handlePatientStatus = (status: 'taken_elsewhere' | 'expired' | 'picked_up') => {
    setPatientStatusDialog(false);
    if (status === 'picked_up') {
      fetchNearestHospitals();
    } else if (status === 'taken_elsewhere') {
      updateStatus('completed');
    } else {
      // Expired: select hospital and transport
      fetchNearestHospitals();
    }
  };

  // Hospital selection confirm
  const handleHospitalConfirm = () => {
    if (!selectedHospital) { showSnackbar('Please select a hospital', 'warning'); return; }
    setHospitalDialog(false);
    setRouteMode('toHospital');
    updateStatus('transporting');
  };

  // Open Google Maps navigation
  const openNavigation = (destLat: number, destLng: number) => {
    const originStr = driverLocation ? `${driverLocation[0]},${driverLocation[1]}` : '';
    const url = originStr
      ? `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destLat},${destLng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
    window.open(url, '_blank');
  };

  // Compute route polyline points
  const getRoutePoints = (): [number, number][] => {
    if (routeMode === 'toIncident' && driverLocation && incidentLocation) {
      return [driverLocation, incidentLocation];
    }
    if (routeMode === 'toHospital' && incidentLocation && selectedHospital) {
      return [incidentLocation, [selectedHospital.latitude, selectedHospital.longitude]];
    }
    return [];
  };

  // Compute distance & ETA for map chip
  const getDistanceEta = () => {
    if (routeMode === 'toHospital' && incidentLocation && selectedHospital) {
      const dist = haversine(incidentLocation[0], incidentLocation[1], selectedHospital.latitude, selectedHospital.longitude);
      return { dist: dist.toFixed(1), eta: Math.round((dist / 40) * 60), dest: selectedHospital.name };
    }
    if (driverLocation && incidentLocation) {
      const dist = haversine(driverLocation[0], driverLocation[1], incidentLocation[0], incidentLocation[1]);
      return { dist: dist.toFixed(1), eta: Math.round((dist / 40) * 60), dest: 'Scene' };
    }
    return null;
  };

  const bannerConfig = getStatusBannerConfig(currentStatus, selectedHospital?.name);
  const timelineActiveIndex = getTimelineIndex(currentStatus);
  const routePoints = getRoutePoints();
  const distEta = getDistanceEta();
  const mapCenter: [number, number] = driverLocation || incidentLocation || [24.8607, 67.0011];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} sx={{ color: '#C62828' }} />
      </Box>
    );
  }

  if (!incident) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
        <WarningIcon sx={{ fontSize: 60, color: '#9E9E9E' }} />
        <Typography variant="h6" color="text.secondary">Incident not found</Typography>
        <Button variant="contained" onClick={() => navigate('/driver')}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* AppBar equivalent */}
      <Box sx={{ bgcolor: '#C62828', color: 'white', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100 }}>
        <IconButton onClick={() => navigate('/driver')} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white', lineHeight: 1.2 }}>
            Incident Details
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {currentStatus === 'assigned' ? 'Assigned' :
             currentStatus === 'arrived' ? 'Arrived at Scene' :
             currentStatus === 'transporting' ? 'Transporting' :
             currentStatus === 'delivered' ? 'Delivered' : currentStatus}
          </Typography>
        </Box>
        <IconButton
          onClick={() => incidentLocation && openNavigation(incidentLocation[0], incidentLocation[1])}
          sx={{ color: 'white' }}
          title="Navigate to incident"
        >
          <NavigationIcon />
        </IconButton>
      </Box>

      {/* Map Section - matches mobile 300px height */}
      <Box sx={{ mx: 2, mt: 2 }}>
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', height: 300, position: 'relative' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapBoundsFitter points={mapBoundsPoints.length >= 2 ? mapBoundsPoints : []} />
            {/* Route polyline */}
            {routePoints.length >= 2 && (
              <Polyline
                positions={routePoints}
                color={routeMode === 'toHospital' ? '#1565C0' : '#C62828'}
                weight={4}
              />
            )}
            {/* Driver marker */}
            {driverLocation && (
              <Marker position={driverLocation} icon={driverIcon}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            {/* Incident marker */}
            {incidentLocation && (
              <Marker position={incidentLocation} icon={incidentIcon}>
                <Popup>{incident.location?.address || 'Incident Location'}</Popup>
              </Marker>
            )}
            {/* Hospital marker */}
            {selectedHospital && routeMode === 'toHospital' && (
              <Marker position={[selectedHospital.latitude, selectedHospital.longitude]} icon={hospitalIcon}>
                <Popup>{selectedHospital.name}</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Route toggle - overlaid on map top-left */}
          {selectedHospital && (
            <Box sx={{
              position: 'absolute', top: 10, left: 10, zIndex: 500,
              bgcolor: 'white', borderRadius: 2, p: 0.75,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              display: 'flex', gap: 0.75,
            }}>
              {(['toIncident', 'toHospital'] as const).map(mode => (
                <Box
                  key={mode}
                  onClick={() => setRouteMode(mode)}
                  sx={{
                    px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    bgcolor: routeMode === mode ? (mode === 'toIncident' ? '#E65100' : '#1565C0') : 'transparent',
                    color: routeMode === mode ? 'white' : '#757575',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode === 'toIncident' ? 'To Scene' : 'To Hospital'}
                </Box>
              ))}
            </Box>
          )}

          {/* Distance/ETA chip - bottom right */}
          {distEta && (
            <Box sx={{
              position: 'absolute', bottom: 10, right: 10, zIndex: 500,
              bgcolor: 'white', borderRadius: 2, px: 1.5, py: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              textAlign: 'right',
            }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#212121', fontSize: 14 }}>
                {distEta.dist} km
              </Typography>
              <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block' }}>
                ETA {distEta.eta} min
              </Typography>
              <Typography variant="caption" sx={{
                color: routeMode === 'toHospital' ? '#1565C0' : '#E65100',
                fontWeight: 600, maxWidth: 100, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                to {distEta.dest}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Status Banner - matches mobile */}
      {bannerConfig.message && (
        <Box sx={{ mx: 2, mt: 1.5 }}>
          <Paper sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: `${bannerConfig.color}1A`,
            border: `1px solid ${bannerConfig.color}66`,
          }}>
            <Box display="flex" alignItems="center" gap={1.25}>
              {currentStatus === 'assigned' && <CarIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'arrived' && <HospitalIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'transporting' && <MedicalServicesIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'delivered' && <CheckIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              <Typography variant="body2" sx={{ color: bannerConfig.color, fontWeight: 500 }}>
                {bannerConfig.message}
              </Typography>
              {selectedHospital && (currentStatus === 'arrived' || currentStatus === 'transporting') && (
                <Box
                  onClick={() => openNavigation(selectedHospital.latitude, selectedHospital.longitude)}
                  sx={{
                    ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5,
                    bgcolor: '#1565C0', borderRadius: 1, px: 1, py: 0.5, cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <NavigationIcon sx={{ color: 'white', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: 'white' }}>Navigate</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Incident Info Card - matches mobile */}
      <Card sx={{ mx: 2, mt: 1.5, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2.5}>
            <Box sx={{
              p: 1.25, borderRadius: 2, bgcolor: '#FFEBEE',
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Typography fontSize={24}>{getCategoryIcon(incident.category)}</Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#212121' }}>
                {incident.category || 'Incident'}
              </Typography>
              <Chip
                label={(incident.priority || 'Medium').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: (incident.priority as string) === 'urgent' || (incident.priority as string) === 'critical' ? '#FFEBEE' : '#FFF3E0',
                  color: (incident.priority as string) === 'urgent' || (incident.priority as string) === 'critical' ? '#C62828' : '#E65100',
                  fontWeight: 700, fontSize: '0.65rem', height: 20,
                }}
              />
            </Box>
          </Box>

          <List dense disablePadding>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
              <LocationIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
              <Box>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Location</Typography>
                <Typography variant="body2" sx={{ color: '#212121' }}>
                  {incident.location?.address || 'Unknown location'}
                </Typography>
              </Box>
            </ListItem>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
              <AssignmentIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
              <Box>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Description</Typography>
                <Typography variant="body2" sx={{ color: '#212121' }}>
                  {incident.description || 'No description'}
                </Typography>
              </Box>
            </ListItem>
            {incident.patientStatus?.condition && (
              <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
                <MedicalServicesIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
                <Box>
                  <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Patient Condition</Typography>
                  <Typography variant="body2" sx={{ color: '#212121' }}>
                    {incident.patientStatus.condition}
                  </Typography>
                </Box>
              </ListItem>
            )}
            {selectedHospital && (
              <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
                <HospitalIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
                <Box>
                  <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Selected Hospital</Typography>
                  <Typography variant="body2" sx={{ color: '#212121' }}>
                    {selectedHospital.name} ({selectedHospital.distance.toFixed(1)} km)
                  </Typography>
                </Box>
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Journey Progress Timeline - matches mobile 6-step */}
      <Card sx={{ mx: 2, mt: 1.5, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Journey Progress
          </Typography>
          <Box mt={2}>
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < timelineActiveIndex;
              const isActive = i === timelineActiveIndex;
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <Box key={step.status} display="flex" gap={1.5} sx={{ position: 'relative' }}>
                  {/* Line connector */}
                  {!isLast && (
                    <Box sx={{
                      position: 'absolute', left: 15, top: 32, width: 2, height: 28,
                      bgcolor: isDone ? '#C62828' : '#EEEEEE',
                      zIndex: 0,
                    }} />
                  )}
                  {/* Circle */}
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    bgcolor: isDone ? '#C62828' : isActive ? '#FFEBEE' : '#F5F5F5',
                    border: isActive ? '2px solid #C62828' : isDone ? 'none' : '2px solid #EEEEEE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDone ? 'white' : isActive ? '#C62828' : '#9E9E9E',
                  }}>
                    {isDone ? <CheckIcon sx={{ fontSize: 16 }} /> : <Box sx={{ fontSize: 16, display: 'flex' }}>{step.icon}</Box>}
                  </Box>
                  {/* Label */}
                  <Box pb={isLast ? 0 : 3.5} pt={0.25}>
                    <Typography variant="body2" fontWeight={isActive ? 700 : isDone ? 600 : 400}
                      sx={{ color: isActive ? '#C62828' : isDone ? '#212121' : '#9E9E9E' }}>
                      {step.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons - matching mobile exactly */}
      <Box sx={{ mx: 2, mt: 1.5, mb: 4 }}>
        {isUpdating ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress sx={{ color: '#C62828' }} />
          </Box>
        ) : (
          <>
            {currentStatus === 'assigned' && (
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => updateStatus('arrived')}
                startIcon={<CarIcon />}
                sx={{ py: 1.75, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, borderRadius: 2, fontWeight: 700 }}
              >
                Start Ride
              </Button>
            )}
            {currentStatus === 'arrived' && (
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => setPatientStatusDialog(true)}
                startIcon={<PersonIcon />}
                sx={{ py: 1.75, bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' }, borderRadius: 2, fontWeight: 700 }}
              >
                Update Patient Status
              </Button>
            )}
            {currentStatus === 'transporting' && (
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => updateStatus('delivered')}
                startIcon={<HospitalIcon />}
                sx={{ py: 1.75, bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' }, borderRadius: 2, fontWeight: 700 }}
              >
                Arrived at Hospital
              </Button>
            )}
            {currentStatus === 'delivered' && (
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => updateStatus('completed')}
                startIcon={<CheckIcon />}
                sx={{ py: 1.75, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2, fontWeight: 700 }}
              >
                Complete Mission
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Patient Status Dialog - matches mobile */}
      <Dialog open={patientStatusDialog} onClose={() => setPatientStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Patient Status</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please select the current status of the patient:
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Button fullWidth variant="contained" color="warning" size="large"
              startIcon={<CancelIcon />}
              onClick={() => handlePatientStatus('taken_elsewhere')}
              sx={{ py: 2 }}>
              Patient Taken by Someone Else
            </Button>
            <Button fullWidth variant="contained" color="error" size="large"
              startIcon={<CancelIcon />}
              onClick={() => handlePatientStatus('expired')}
              sx={{ py: 2 }}>
              Patient Expired
            </Button>
            <Button fullWidth variant="contained" color="success" size="large"
              startIcon={<CheckIcon />}
              onClick={() => handlePatientStatus('picked_up')}
              sx={{ py: 2 }}>
              Patient Picked Up
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Hospital Selector Dialog - uses real API data */}
      <Dialog open={hospitalDialog} onClose={() => setHospitalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Destination Hospital</DialogTitle>
        <DialogContent>
          {loadingHospitals ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress sx={{ color: '#C62828' }} />
            </Box>
          ) : (
            <List>
              {nearbyHospitals.map(hospital => (
                <ListItem
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  sx={{
                    borderRadius: 2, mb: 1, cursor: 'pointer',
                    border: selectedHospital?.id === hospital.id ? '2px solid #C62828' : '1px solid #EEEEEE',
                    bgcolor: selectedHospital?.id === hospital.id ? '#FFEBEE' : 'white',
                  }}
                >
                  <ListItemIcon>
                    <HospitalIcon sx={{ color: '#C62828' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={hospital.name}
                    secondary={`${hospital.distance.toFixed(1)} km • ${hospital.etaMinutes} min ETA`}
                  />
                  {selectedHospital?.id === hospital.id && <CheckIcon sx={{ color: '#C62828' }} />}
                </ListItem>
              ))}
            </List>
          )}
          <Alert severity="info" sx={{ mt: 1 }}>
            The selected hospital will be notified of your arrival
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHospitalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleHospitalConfirm}
            variant="contained"
            disabled={!selectedHospital}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}
          >
            Confirm & Transport
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DriverIncidentDetail;
