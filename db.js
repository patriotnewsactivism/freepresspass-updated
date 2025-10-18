// Database implementation using Express API and PostgreSQL
// This file provides a client-side interface to the database via API calls

class Database {
  constructor() {
    // Base URL for API calls (empty string means same origin)
    this.apiBaseUrl = '';
    
    // Fallback to localStorage if offline or for development
    this.storageKey = 'pressPasses';
    this.ensureLocalStorage();
  }

  // Ensure localStorage has the required structure for offline/development use
  ensureLocalStorage() {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Add a new press pass to the database via API
  async addPass(passData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/track-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: passData.name,
          email: passData.email,
          title: passData.title || null,
          pass_number: passData.pass_number || this.generateId(),
          organization: passData.organization || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        // Fall back to localStorage if API fails
        return this.addPassToLocalStorage(passData);
      }

      return await response.json();
    } catch (err) {
      console.error('Database error:', err);
      // Fall back to localStorage if there's any error
      return this.addPassToLocalStorage(passData);
    }
  }

  // Fallback method to add pass to localStorage
  addPassToLocalStorage(passData) {
    try {
      const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      const newPass = {
        ...passData,
        id: this.generateId(),
        created_at: new Date().toISOString()
      };
      passes.push(newPass);
      localStorage.setItem(this.storageKey, JSON.stringify(passes));
      return newPass;
    } catch (err) {
      console.error('LocalStorage error:', err);
      return null;
    }
  }

  // Generate a unique ID for each pass
  generateId() {
    return 'FP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Get all passes from the database via API
  async getAllPasses() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/get-passes`);
      
      if (!response.ok) {
        console.error('API error:', response.statusText);
        // Fall back to localStorage
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
      }

      return await response.json();
    } catch (err) {
      console.error('Database error:', err);
      // Fall back to localStorage
      return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }
  }

  // Get a specific pass by ID via API
  async getPassById(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/get-pass/${id}`);
      
      if (!response.ok) {
        console.error('API error:', response.statusText);
        // Fall back to localStorage
        const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        return passes.find(pass => pass.id === id || pass.pass_number === id);
      }

      return await response.json();
    } catch (err) {
      console.error('Database error:', err);
      // Fall back to localStorage
      const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      return passes.find(pass => pass.id === id || pass.pass_number === id);
    }
  }

  // Delete a pass by ID
  async deletePassById(id) {
    try {
      // Try to delete from Supabase first
      const { error } = await this.supabase
        .from('press_passes')
        .delete()
        .eq('pass_number', id);

      if (error) {
        console.error('Supabase error:', error);
        // Fall back to localStorage
        const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const filteredPasses = passes.filter(pass => pass.id !== id && pass.pass_number !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filteredPasses));
        return filteredPasses;
      }

      // Also remove from localStorage if it exists there
      const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      const filteredPasses = passes.filter(pass => pass.id !== id && pass.pass_number !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredPasses));
      
      return await this.getAllPasses();
    } catch (err) {
      console.error('Database error:', err);
      // Fall back to localStorage
      const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      const filteredPasses = passes.filter(pass => pass.id !== id && pass.pass_number !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredPasses));
      return filteredPasses;
    }
  }

  // Update a pass by ID
  async updatePassById(id, updateData) {
    try {
      // Try to update in Supabase first
      const { data, error } = await this.supabase
        .from('press_passes')
        .update({
          full_name: updateData.name,
          email: updateData.email,
          title: updateData.title,
          organization: updateData.organization
        })
        .eq('pass_number', id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        // Fall back to localStorage
        const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const passIndex = passes.findIndex(pass => pass.id === id || pass.pass_number === id);
        
        if (passIndex !== -1) {
          passes[passIndex] = {
            ...passes[passIndex],
            ...updateData
          };
          localStorage.setItem(this.storageKey, JSON.stringify(passes));
          return passes[passIndex];
        }
        
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Database error:', err);
      // Fall back to localStorage
      const passes = JSON.parse(localStorage.getItem(this.storageKey)) || [];
      const passIndex = passes.findIndex(pass => pass.id === id || pass.pass_number === id);
      
      if (passIndex !== -1) {
        passes[passIndex] = {
          ...passes[passIndex],
          ...updateData
        };
        localStorage.setItem(this.storageKey, JSON.stringify(passes));
        return passes[passIndex];
      }
      
      return null;
    }
  }

  // Get passes count
  async getPassesCount() {
    const passes = await this.getAllPasses();
    return passes.length;
  }

  // Get passes for current month
  async getMonthlyPasses() {
    const passes = await this.getAllPasses();
    const currentMonth = new Date().toISOString().slice(0, 7);
    return passes.filter(pass => {
      const createdAt = pass.created_at || pass.issued_at;
      return createdAt && createdAt.startsWith(currentMonth);
    });
  }

  // Get unique email domains
  async getUniqueEmailDomains() {
    const passes = await this.getAllPasses();
    const domains = passes
      .filter(pass => pass.email)
      .map(pass => pass.email.split('@')[1]);
    return [...new Set(domains)];
  }
}

// Create a global instance of the database
const db = new Database();

// Export the database instance
export default db;