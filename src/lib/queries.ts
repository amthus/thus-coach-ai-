import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { LoginInput, ProfileInput, RegisterInput, SettingsInput, WorkoutLogInput } from '../../shared/schemas';
import type {
  AdminStats,
  AdminUserRow,
  ChatMessage,
  DashboardStats,
  PlanSummary,
  PublicUser,
  TrainingPlan,
  UserProfile,
  WorkoutLog,
} from '../../shared/types';

export const qk = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  activePlan: ['plans', 'active'] as const,
  plans: ['plans', 'list'] as const,
  plan: (id: string) => ['plans', id] as const,
  workouts: ['workouts'] as const,
  stats: ['stats'] as const,
  chat: ['chat'] as const,
  meta: ['meta'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminUsers: (q: string, page: number) => ['admin', 'users', q, page] as const,
};

// ------------------------------------------------------------------ Auth
/**
 * Switches the cached identity without calling queryClient.clear(): clearing would detach
 * mounted useMe() observers (route guards) so they would never see the new user.
 */
export function resetSession(qc: QueryClient, user: PublicUser | null) {
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  qc.setQueryData(qk.me, user);
}

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: ({ signal }) => api.get<{ user: PublicUser | null }>('/auth/me', signal).then((r) => r.user),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: PublicUser }>('/auth/login', input),
    onSuccess: ({ user }) => resetSession(qc, user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<{ user: PublicUser }>('/auth/register', input),
    onSuccess: ({ user }) => resetSession(qc, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => resetSession(qc, null),
  });
}

// ------------------------------------------------------------------ Account
export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: ({ signal }) => api.get<{ profile: UserProfile | null }>('/me/profile', signal).then((r) => r.profile),
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => api.put<{ profile: UserProfile }>('/me/profile', input).then((r) => r.profile),
    onSuccess: (profile) => {
      qc.setQueryData(qk.profile, profile);
      qc.setQueryData<PublicUser | null>(qk.me, (u) => (u ? { ...u, hasProfile: true } : u));
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => api.patch<{ user: PublicUser }>('/me/settings', input).then((r) => r.user),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

// ------------------------------------------------------------------ Plans
export function useActivePlan() {
  return useQuery({
    queryKey: qk.activePlan,
    queryFn: ({ signal }) => api.get<{ plan: TrainingPlan | null }>('/plans/active', signal).then((r) => r.plan),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: qk.plans,
    queryFn: ({ signal }) => api.get<{ plans: PlanSummary[] }>('/plans', signal).then((r) => r.plans),
  });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ plan: TrainingPlan }>('/plans/generate').then((r) => r.plan),
    onSuccess: (plan) => {
      qc.setQueryData(qk.activePlan, plan);
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ plan: TrainingPlan }>(`/plans/${id}/activate`).then((r) => r.plan),
    onSuccess: (plan) => {
      qc.setQueryData(qk.activePlan, plan);
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: qk.workouts });
      qc.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

// ------------------------------------------------------------------ Workouts
export function useWorkouts() {
  return useQuery({
    queryKey: qk.workouts,
    queryFn: ({ signal }) => api.get<{ workouts: WorkoutLog[] }>('/workouts', signal).then((r) => r.workouts),
  });
}

function invalidateTraining(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.workouts });
  qc.invalidateQueries({ queryKey: qk.stats });
  qc.invalidateQueries({ queryKey: qk.plans });
}

export function useLogWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<WorkoutLogInput> & { planId: string; sessionId: string }) =>
      api.post<{ workout: WorkoutLog }>('/workouts', input).then((r) => r.workout),
    onSuccess: (w) => {
      qc.setQueryData<WorkoutLog[]>(qk.workouts, (list) => (list ? [w, ...list] : list));
      invalidateTraining(qc);
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Omit<WorkoutLogInput, 'planId' | 'sessionId'>>) =>
      api.patch<{ workout: WorkoutLog }>(`/workouts/${id}`, patch).then((r) => r.workout),
    onSuccess: (w) => {
      qc.setQueryData<WorkoutLog[]>(qk.workouts, (list) => list?.map((x) => (x.id === w.id ? w : x)));
      invalidateTraining(qc);
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workouts/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.workouts });
      const prev = qc.getQueryData<WorkoutLog[]>(qk.workouts);
      qc.setQueryData<WorkoutLog[]>(qk.workouts, (list) => list?.filter((x) => x.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(qk.workouts, ctx.prev),
    onSettled: () => invalidateTraining(qc),
  });
}

export function useWorkoutAdvice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ workout: WorkoutLog }>(`/workouts/${id}/advice`).then((r) => r.workout),
    onSuccess: (w) => qc.setQueryData<WorkoutLog[]>(qk.workouts, (list) => list?.map((x) => (x.id === w.id ? w : x))),
  });
}

export function useStats() {
  return useQuery({
    queryKey: qk.stats,
    queryFn: ({ signal }) => api.get<{ stats: DashboardStats }>('/stats', signal).then((r) => r.stats),
  });
}

// ------------------------------------------------------------------ Chat
export function useChat() {
  return useQuery({
    queryKey: qk.chat,
    queryFn: ({ signal }) => api.get<{ messages: ChatMessage[]; aiAvailable: boolean }>('/chat', signal),
  });
}

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.post<{ messages: ChatMessage[] }>('/chat', { message }).then((r) => r.messages),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: qk.chat });
      const prev = qc.getQueryData<{ messages: ChatMessage[]; aiAvailable: boolean }>(qk.chat);
      const optimistic: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: message,
        coachId: 'michel',
        source: null,
        createdAt: new Date().toISOString(),
      };
      if (prev) qc.setQueryData(qk.chat, { ...prev, messages: [...prev.messages, optimistic] });
      return { prev };
    },
    onSuccess: (msgs, _m, ctx) => {
      const base = ctx?.prev ?? { messages: [], aiAvailable: true };
      qc.setQueryData(qk.chat, { ...base, messages: [...base.messages, ...msgs] });
    },
    onError: (_e, _m, ctx) => ctx?.prev && qc.setQueryData(qk.chat, ctx.prev),
  });
}

export function useClearChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/chat'),
    onSuccess: () => qc.setQueryData<{ messages: ChatMessage[]; aiAvailable: boolean }>(qk.chat, (d) => (d ? { ...d, messages: [] } : d)),
  });
}

export function useMeta() {
  return useQuery({
    queryKey: qk.meta,
    queryFn: ({ signal }) => api.get<{ ai: { gemini: boolean; granite: boolean }; emailDelivery: boolean }>('/meta', signal),
    staleTime: 30 * 60_000,
  });
}

// ------------------------------------------------------------------ Admin
export function useAdminStats() {
  return useQuery({
    queryKey: qk.adminStats,
    queryFn: ({ signal }) => api.get<{ stats: AdminStats }>('/admin/stats', signal).then((r) => r.stats),
  });
}

export function useAdminUsers(q: string, page: number) {
  return useQuery({
    queryKey: qk.adminUsers(q, page),
    queryFn: ({ signal }) =>
      api.get<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }>(
        `/admin/users?${new URLSearchParams({ q, page: String(page) })}`,
        signal,
      ),
    placeholderData: (prev) => prev,
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'athlete' | 'admin' }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
