const BASE = ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'same-origin',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: 'UNKNOWN', message: res.statusText }))
    throw body
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; phone?: string; salonName: string; city: string; address: string }) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request<any>('/api/auth/me'),

  // Owner - Salon
  getSalon: () => request<any>('/api/owner/salon'),
  updateSalon: (data: any) =>
    request('/api/owner/salon', { method: 'PUT', body: JSON.stringify(data) }),

  // Owner - Services
  getServices: () => request<any[]>('/api/owner/services'),
  createService: (data: any) =>
    request('/api/owner/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: number, data: any) =>
    request(`/api/owner/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: number) =>
    request(`/api/owner/services/${id}`, { method: 'DELETE' }),

  // Owner - Working Hours
  getWorkingHours: () => request<any[]>('/api/owner/working-hours'),
  setWorkingHours: (data: { days: any[] }) =>
    request('/api/owner/working-hours', { method: 'PUT', body: JSON.stringify(data) }),

  // Owner - Appointments
  getAppointments: (date: string) =>
    request<any[]>(`/api/owner/appointments?date=${date}`),
  createAppointment: (data: { serviceId: number; startTime: string; clientName: string; clientPhone?: string; comment?: string }) =>
    request('/api/owner/appointments', { method: 'POST', body: JSON.stringify(data) }),
  cancelAppointment: (id: number) =>
    request(`/api/owner/appointments/${id}/cancel`, { method: 'PATCH' }),
  completeAppointment: (id: number) =>
    request(`/api/owner/appointments/${id}/complete`, { method: 'PATCH' }),
  noShowAppointment: (id: number) =>
    request(`/api/owner/appointments/${id}/no-show`, { method: 'PATCH' }),

  // Owner - Onboarding
  getOnboardingStatus: () =>
    request<{ hasServices: boolean; hasCustomHours: boolean }>('/api/owner/onboarding-status'),

  // Owner - Push notifications
  subscribePush: (data: { endpoint: string; p256dh: string; auth: string }) =>
    request('/api/owner/push/subscribe', { method: 'POST', body: JSON.stringify(data) }),

  // Public - Push
  getVapidKey: async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/public/push/vapid-key', { credentials: 'same-origin' })
      if (!res.ok) return null
      return res.text()
    } catch {
      return null
    }
  },

  // Public
  publicSalon: (slug: string) => request<any>(`/api/public/salons/${slug}`),
  publicServices: (slug: string) => request<any[]>(`/api/public/salons/${slug}/services`),
  publicSlots: (slug: string, serviceId: number, date: string) =>
    request<any[]>(`/api/public/salons/${slug}/slots?serviceId=${serviceId}&date=${date}`),
  publicBook: (slug: string, data: any) =>
    request(`/api/public/salons/${slug}/book`, { method: 'POST', body: JSON.stringify(data) }),
  publicWorkingHours: (slug: string) =>
    request<any[]>(`/api/public/salons/${slug}/working-hours`),
  publicStats: (slug: string) =>
    request<{ bookingsThisMonth: number }>(`/api/public/salons/${slug}/stats`),
  publicClientLookup: (slug: string, phone: string) =>
    request<{ clientName?: string }>(`/api/public/salons/${slug}/client-lookup?phone=${encodeURIComponent(phone)}`),

  // Explore
  exploreSalons: (city?: string) =>
    request<any[]>(`/api/public/explore/salons${city ? `?city=${encodeURIComponent(city)}` : ''}`),
}
