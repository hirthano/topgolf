import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const demoUsers: User[] = [
  {
    id: 'usr-001',
    name: 'Budi Santoso',
    email: 'admin@topgolf.co.id',
    role: 'admin',
    branch: 'Head Office',
    avatar: undefined,
  },
  {
    id: 'usr-002',
    name: 'Rina Wijaya',
    email: 'manager.bellezza@topgolf.co.id',
    role: 'manager',
    branch: 'Topgolf Bellezza',
    avatar: undefined,
  },
  {
    id: 'usr-003',
    name: 'Andi Pratama',
    email: 'pic.scbd@topgolf.co.id',
    role: 'pic',
    branch: 'Topgolf SCBD Premier',
    avatar: undefined,
  },
  {
    id: 'usr-004',
    name: 'Dewi Kusuma',
    email: 'finance@topgolf.co.id',
    role: 'finance',
    branch: 'Head Office',
    avatar: undefined,
  },
  {
    id: 'usr-005',
    name: 'Fajar Hidayat',
    email: 'employee@topgolf.co.id',
    role: 'employee',
    branch: 'Topgolf Cilandak',
    avatar: undefined,
  },
]

export { demoUsers }

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('topgolf-user') || 'null'),
  isAuthenticated: !!localStorage.getItem('topgolf-user'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600))

    const user = demoUsers.find(u => u.email === email)
    if (!user) {
      set({ isLoading: false, error: 'User not found. Try a demo account.' })
      return false
    }

    // Accept any non-empty password for demo
    if (!password || password.length < 1) {
      set({ isLoading: false, error: 'Please enter a password.' })
      return false
    }

    localStorage.setItem('topgolf-user', JSON.stringify(user))
    set({ user, isAuthenticated: true, isLoading: false })
    return true
  },

  logout: () => {
    localStorage.removeItem('topgolf-user')
    set({ user: null, isAuthenticated: false })
  },

  clearError: () => set({ error: null }),
}))
