import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'

interface UserState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
}

interface UserActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  continueAsGuest: () => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (user, accessToken, refreshToken) => {
        // Also persist tokens in localStorage for the API interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
        })
      },

      continueAsGuest: () => {
        const guestUser: User = {
          id: 'guest-local',
          email: 'guest@local',
          firstName: 'Guest',
          lastName: 'User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          hasResume: false,
          hasPreferences: false,
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }

        set({
          user: guestUser,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: true,
          isGuest: true,
          isLoading: false,
        })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set(initialState)
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'jobfinder-user',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
)
