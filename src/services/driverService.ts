import axios from 'axios';
import { Incident } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DriverStats {
  completedToday: number;
  totalCompleted: number;
  activeAssignments: number;
  totalDistance: string;
  avgResponseTime: string;
  successRate: string;
}

export interface DriverIncident extends Incident {
  driverStatus: 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed';
  driverProgress?: DriverIncidentProgress;
}

export interface DriverIncidentProgress {
  incidentId: string;
  hasArrived: boolean;
  selectedHospital?: string;
  isTransporting: boolean;
  lastUpdated: string;
}

class DriverService {
  // Get driver incidents - FIXED with better error handling
  static async getMyAssignedIncidents(): Promise<{ 
    success: boolean; 
    data: DriverIncident[];
    error?: string 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        return { success: false, data: [], error: 'No authentication token' };
      }

      // Get current user to check role
      const userString = localStorage.getItem('user');
      let currentUser = null;
      if (userString) {
        try {
          currentUser = JSON.parse(userString);
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
        }
      }

      console.log('🚗 Fetching driver incidents...');
      console.log('👤 Current user role:', currentUser?.role);
      
      // If user is superadmin, they can access driver incidents for viewing
      const isSuperAdmin = currentUser?.role === 'superadmin';
      
      if (isSuperAdmin) {
        console.log('👑 Super Admin accessing driver incidents');
        // Super Admin gets all driver incidents or can view as specific driver
        const response = await axios.get(`${API_URL}/api/incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            viewAsDriver: 'true',
            status: 'assigned,in_progress,completed'
          },
          timeout: 10000
        });

        console.log('📥 Super Admin incidents response:', response.data);

        if (response.data.success) {
          const incidents = response.data.data || [];
          const driverIncidents: DriverIncident[] = incidents
            .filter((incident: any) => incident.assignedTo?.driver) // Only incidents with driver assignment
            .map((incident: any) => ({
              ...incident,
              id: incident._id || incident.id || '',
              _id: incident._id || incident.id || '',
              driverStatus: incident.driverStatus || 'assigned',
              status: incident.status || 'pending'
            }));

          console.log(`✅ Found ${driverIncidents.length} driver incidents for Super Admin`);
          
          return { success: true, data: driverIncidents };
        }
      } else {
        // Original logic for drivers
        const response = await axios.get(`${API_URL}/api/incidents/driver/my-incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('📥 Driver incidents response:', response.data);

        if (response.data.success) {
          let incidents = [];
          
          if (Array.isArray(response.data.data)) {
            incidents = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.data)) {
            incidents = response.data.data.data;
          } else if (Array.isArray(response.data)) {
            incidents = response.data;
          }
          
          const driverIncidents: DriverIncident[] = incidents.map((incident: any) => ({
            ...incident,
            id: incident._id || incident.id || '',
            _id: incident._id || incident.id || '',
            driverStatus: incident.driverStatus || 'assigned',
            status: incident.status || 'pending'
          }));

          console.log(`✅ Found ${driverIncidents.length} incidents for driver`);
          
          return { success: true, data: driverIncidents };
        }
      }
      
      return { 
        success: false, 
        data: [], 
        error: 'Failed to get incidents' 
      };
      
    } catch (error: any) {
      console.error('❌ Error getting driver incidents:', error);
      
      return { 
        success: false, 
        data: [], 
        error: error.response?.data?.message || error.message || 'Network error'
      };
    }
  }

  // Get driver dashboard stats - FIXED
  static async getDriverDashboardStats(): Promise<DriverStats> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📊 Fetching driver dashboard stats...');
      
      const response = await axios.get(`${API_URL}/api/dashboard/driver`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      console.log('📥 Driver stats response:', response.data);

      if (response.data.success) {
        const data = response.data.data;
        return {
          completedToday: data.todayCompleted || data.completedToday || 0,
          totalCompleted: data.totalCompleted || 0,
          activeAssignments: data.activeAssignments || data.assignedIncidents?.length || 0,
          totalDistance: data.totalDistance || '0 km',
          avgResponseTime: data.avgResponseTime || '0 mins',
          successRate: data.successRate || '0%'
        };
      }
      
      // Return default stats if API fails
      console.warn('⚠️ Using default driver stats');
      return this.getDefaultStats();
      
    } catch (error: any) {
      console.error('❌ Error getting driver stats:', error);
      // Return default stats on error
      return this.getDefaultStats();
    }
  }

  // Default stats for fallback
  private static getDefaultStats(): DriverStats {
    return {
      completedToday: 0,
      totalCompleted: 0,
      activeAssignments: 0,
      totalDistance: '0 km',
      avgResponseTime: '0 mins',
      successRate: '0%'
    };
  }

  // Update incident status - FIXED with better hospital handling
  static async updateIncidentStatus(
    incidentId: string, 
    status: 'arrived' | 'transporting' | 'delivered' | 'completed',
    hospital?: string,
    condition?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      console.log('🚑 Updating driver incident status:', { 
        incidentId, 
        status, 
        hospital: hospital || 'Not specified' 
      });

      // Determine which endpoint to use based on status
      let endpoint = '';
      let requestData: any = {};

      // Map status to driver workflow
      switch (status) {
        case 'arrived':
          endpoint = `/api/incidents/${incidentId}/driver-status`;
          requestData = { 
            status: 'arrived'
          };
          break;
        case 'transporting':
          endpoint = `/api/incidents/${incidentId}/driver-status`;
          requestData = { 
            status: 'transporting',
            hospital: hospital || 'Jinnah Hospital',
            patientCondition: condition || 'Patient being transported'
          };
          break;
        case 'delivered':
          endpoint = `/api/incidents/${incidentId}/driver-status`;
          requestData = { 
            status: 'delivered',
            hospital: hospital || 'Jinnah Hospital',
            patientCondition: condition || 'Patient delivered to hospital'
          };
          break;
        case 'completed':
          endpoint = `/api/incidents/${incidentId}/driver-status`;
          requestData = { 
            status: 'completed',
            hospital: hospital || 'Jinnah Hospital',
            patientCondition: condition || 'Treatment completed'
          };
          break;
        default:
          endpoint = `/api/incidents/${incidentId}/status`;
          requestData = { status };
      }

      console.log('📤 Sending to:', endpoint);
      console.log('📤 Data:', requestData);

      const response = await axios.put(
        `${API_URL}${endpoint}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📥 Status update response:', response.data);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Update failed' };
      }
    } catch (error: any) {
      console.error('❌ Error updating incident status:', error);
      
      if (error.response) {
        console.error('🔍 Response error details:', {
          status: error.response.status,
          data: error.response.data,
          endpoint: error.config?.url
        });
        
        return { 
          success: false, 
          error: error.response.data?.message || 
                 error.response.data?.error || 
                 `Server error: ${error.response.status}`
        };
      } else if (error.request) {
        console.error('🔍 No response received');
        return { success: false, error: 'No response from server. Check if backend is running.' };
      } else {
        console.error('🔍 Request setup error:', error.message);
        return { success: false, error: error.message };
      }
    }
  }

  static async getDriverIncidentsForSuperAdmin(driverId: any) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/admin/driver-incidents/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting driver incidents for super admin:', error);
      throw error;
    }
  }

  // Get driver workflow dashboard
  static async getDriverWorkflowDashboard(): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.get(`${API_URL}/api/incidents/driver/workflow`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting driver workflow:', error);
      return { success: false, error: 'Failed to get workflow data' };
    }
  }

  // Get incidents by driver status
  static async getIncidentsByDriverStatus(status: string): Promise<{ 
    success: boolean; 
    data: DriverIncident[] 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/incidents/driver/status/${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const incidents = (response.data.data || []).map((incident: any) => ({
          ...incident,
          id: incident._id || incident.id || '',
          _id: incident._id || incident.id || '',
          driverStatus: incident.driverStatus || 'assigned'
        }));
        return { success: true, data: incidents };
      }
      return { success: false, data: [] };
    } catch (error: any) {
      console.error('❌ Error getting incidents by status:', error);
      return { success: false, data: [] };
    }
  }

  // Debug method to check driver information
  static async debugDriverInfo(): Promise<void> {
    try {
      const userString = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('=== DRIVER DEBUG INFO ===');
      console.log('🔑 Token exists:', !!token);
      
      if (userString) {
        try {
          const user = JSON.parse(userString);
          console.log('👤 User data:', user);
          console.log('👤 User ID:', user._id || user.id || user.userId);
          console.log('👤 Role:', user.role);
          console.log('👤 Department:', user.department);
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
        }
      }

      // Test API connection
      try {
        const response = await axios.get(`${API_URL}/api/health`, {
          timeout: 3000
        });
        console.log('✅ Backend health check:', response.data.success);
      } catch (error) {
        console.error('❌ Backend health check failed:', error);
      }

      console.log('🌐 API URL:', API_URL);
      console.log('========================');
    } catch (error) {
      console.error('❌ Error in debugDriverInfo:', error);
    }
  }
}

export default DriverService;