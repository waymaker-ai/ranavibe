/**
 * User Service - AADS Compliant
 *
 * This service demonstrates AADS best practices:
 * - Real API calls (no mocks)
 * - Proper error handling
 * - TypeScript types
 * - Clean service layer pattern
 */

// ✅ AADS: Proper TypeScript types
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

// API configuration
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * User service for managing user data
 *
 * AADS Pattern: Service layer
 * - Encapsulates API logic
 * - Provides typed responses
 * - Handles errors consistently
 */
class UserService {
  /**
   * Get all users from API
   *
   * ✅ AADS: Real API call, not mocks
   * ✅ AADS: Proper error handling
   * ✅ AADS: TypeScript return type
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as User[];
    } catch (error) {
      // ✅ AADS: Proper error handling
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   *
   * ✅ AADS: Real API call
   * ✅ AADS: Error handling
   * ✅ AADS: TypeScript types
   */
  async getUser(id: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as User;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   *
   * Note: This is a mock API, so it won't actually create
   * a user, but demonstrates the pattern
   */
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as User;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

// ✅ AADS Pattern: Export singleton instance
export const userService = new UserService();

// Also export the class for testing
export { UserService };
