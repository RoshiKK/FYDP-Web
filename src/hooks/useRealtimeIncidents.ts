// src/hooks/useRealtimeIncidents.ts - UPDATED WITH AUTO-REFRESH

import { useEffect, useState, useCallback, useRef } from 'react';
import { SocketService } from '../services/SocketService';
import { Incident } from '../contexts/AuthContext';

interface UseRealtimeIncidentsProps {
  onNewIncident?: (incident: Incident) => void;
  onIncidentUpdated?: (incident: Incident) => void;
  onIncidentApproved?: (incident: Incident) => void;
  onIncidentAssigned?: (data: any) => void;
  onIncidentAvailable?: (data: any) => void;
  onIncidentClaimed?: (data: any) => void;
  onIncidentAutoAssigned?: (data: any) => void;
  onDriverAssigned?: (data: any) => void;
  onDriverRejected?: (data: any) => void;
  onAssignmentCountdown?: (data: any) => void;
  onAssignmentExpired?: (data: any) => void;
  onRejectionConfirmed?: (data: any) => void;
  playSound?: boolean;
  soundType?: 'new' | 'assignment' | 'countdown' | 'default';
  role?: 'admin' | 'department' | 'driver' | 'superadmin';
  autoRefresh?: boolean;
  refreshCallback?: () => void;
}

export const useRealtimeIncidents = ({
  onNewIncident,
  onIncidentUpdated,
  onIncidentApproved,
  onIncidentAssigned,
  onIncidentAvailable,
  onIncidentClaimed,
  onIncidentAutoAssigned,
  onDriverAssigned,
  onDriverRejected,
  onAssignmentCountdown,
  onAssignmentExpired,
  onRejectionConfirmed,
  playSound = true,
  soundType = 'default',
  role,
  autoRefresh = true,
  refreshCallback
}: UseRealtimeIncidentsProps = {}) => {
  const [lastEvent, setLastEvent] = useState<{type: string; data: any; timestamp: Date} | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-refresh helper
  const triggerAutoRefresh = useCallback(() => {
    if (!autoRefresh || !refreshCallback) return;
    
    // Debounce refresh to avoid multiple rapid refreshes
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-refreshing data due to real-time event');
      refreshCallback();
      refreshTimeoutRef.current = null;
    }, 500);
  }, [autoRefresh, refreshCallback]);

  const handleNewIncident = useCallback((data: any) => {
    console.log('🚨 New incident received:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('new');
    }
    
    setLastEvent({ type: 'newIncident', data, timestamp: new Date() });
    onNewIncident?.(data);
    triggerAutoRefresh();
  }, [onNewIncident, playSound, triggerAutoRefresh]);

  const handleIncidentUpdated = useCallback((data: any) => {
    console.log('🔄 Incident updated:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('default');
    }
    
    setLastEvent({ type: 'incidentUpdated', data, timestamp: new Date() });
    onIncidentUpdated?.(data);
    triggerAutoRefresh();
  }, [onIncidentUpdated, playSound, triggerAutoRefresh]);

  const handleIncidentApproved = useCallback((data: any) => {
    console.log('✅ Incident approved:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentApproved', data, timestamp: new Date() });
    onIncidentApproved?.(data);
    triggerAutoRefresh();
  }, [onIncidentApproved, playSound, triggerAutoRefresh]);

  const handleIncidentAssigned = useCallback((data: any) => {
    console.log('🚗 Incident assigned to driver:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAssigned', data, timestamp: new Date() });
    onIncidentAssigned?.(data);
    triggerAutoRefresh();
  }, [onIncidentAssigned, playSound, triggerAutoRefresh]);

  const handleIncidentAvailable = useCallback((data: any) => {
    console.log('📊 Incident available:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAvailable', data, timestamp: new Date() });
    onIncidentAvailable?.(data);
    triggerAutoRefresh();
  }, [onIncidentAvailable, playSound, triggerAutoRefresh]);

  const handleIncidentClaimed = useCallback((data: any) => {
    console.log('🔒 Incident claimed:', data);
    
    setLastEvent({ type: 'incidentClaimed', data, timestamp: new Date() });
    onIncidentClaimed?.(data);
    triggerAutoRefresh();
  }, [onIncidentClaimed, triggerAutoRefresh]);

  const handleIncidentAutoAssigned = useCallback((data: any) => {
    console.log('🤖 Incident auto-assigned:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAutoAssigned', data, timestamp: new Date() });
    onIncidentAutoAssigned?.(data);
    triggerAutoRefresh();
  }, [onIncidentAutoAssigned, playSound, triggerAutoRefresh]);

  const handleDriverAssigned = useCallback((data: any) => {
    console.log('👨‍✈️ Driver assigned:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'driverAssigned', data, timestamp: new Date() });
    onDriverAssigned?.(data);
    triggerAutoRefresh();
  }, [onDriverAssigned, playSound, triggerAutoRefresh]);

  const handleDriverRejected = useCallback((data: any) => {
    console.log('🔁 Driver rejected:', data);
    
    setLastEvent({ type: 'driverRejected', data, timestamp: new Date() });
    onDriverRejected?.(data);
    triggerAutoRefresh();
  }, [onDriverRejected, triggerAutoRefresh]);

  const handleAssignmentCountdown = useCallback((data: any) => {
    console.log('⏱️ Assignment countdown:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('countdown');
    }
    
    setLastEvent({ type: 'assignmentCountdown', data, timestamp: new Date() });
    onAssignmentCountdown?.(data);
  }, [onAssignmentCountdown, playSound]);

  const handleAssignmentExpired = useCallback((data: any) => {
    console.log('⏰ Assignment expired:', data);
    
    setLastEvent({ type: 'assignmentExpired', data, timestamp: new Date() });
    onAssignmentExpired?.(data);
    triggerAutoRefresh();
  }, [onAssignmentExpired, triggerAutoRefresh]);

  const handleRejectionConfirmed = useCallback((data: any) => {
    console.log('✅ Rejection confirmed:', data);
    
    setLastEvent({ type: 'rejectionConfirmed', data, timestamp: new Date() });
    onRejectionConfirmed?.(data);
    triggerAutoRefresh();
  }, [onRejectionConfirmed, triggerAutoRefresh]);

  useEffect(() => {
    // Register socket listeners based on role
    if (role === 'admin' || role === 'superadmin') {
      SocketService.onNewIncident(handleNewIncident);
      SocketService.onIncidentUpdated(handleIncidentUpdated);
      SocketService.onDriverAssigned(handleDriverAssigned);
    }

    if (role === 'department') {
      SocketService.onIncidentApproved(handleIncidentApproved);
      SocketService.onIncidentAvailable(handleIncidentAvailable);
      SocketService.onIncidentClaimed(handleIncidentClaimed);
      SocketService.onIncidentAutoAssigned(handleIncidentAutoAssigned);
      SocketService.onIncidentUpdated(handleIncidentUpdated);
      SocketService.onDriverRejected(handleDriverRejected);
    }

    if (role === 'driver') {
      SocketService.onIncidentAssigned(handleIncidentAssigned);
      SocketService.onAssignmentCountdown(handleAssignmentCountdown);
      SocketService.onAssignmentExpired(handleAssignmentExpired);
      SocketService.onRejectionConfirmed(handleRejectionConfirmed);
      SocketService.onIncidentUpdated(handleIncidentUpdated);
    }

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [
    role,
    handleNewIncident,
    handleIncidentUpdated,
    handleIncidentApproved,
    handleIncidentAssigned,
    handleIncidentAvailable,
    handleIncidentClaimed,
    handleIncidentAutoAssigned,
    handleDriverAssigned,
    handleDriverRejected,
    handleAssignmentCountdown,
    handleAssignmentExpired,
    handleRejectionConfirmed
  ]);

  return { lastEvent };
};