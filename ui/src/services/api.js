/**
 * API service for fetching insurance policy data from the backend
 */

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api`;

class ApiService {
  static async fetchPolicies(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const url = `${API_BASE_URL}/policies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const policies = await response.json();
      return policies;
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  static async fetchPolicyById(policyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const policyData = await response.json();
      return policyData;
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }

  static async fetchStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  static async fetchProviders() {
    try {
      const response = await fetch(`${API_BASE_URL}/providers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const providers = await response.json();
      return providers;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  static async fetchCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const categories = await response.json();
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async searchPolicies(searchFilters) {
    return this.fetchPolicies(searchFilters);
  }
}

export default ApiService;

