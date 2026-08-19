export type LoginAnimationPhase = 'idle' | 'email' | 'password' | 'submitting' | 'success' | 'error'

export interface LoginAnimationState {
  phase: LoginAnimationPhase
  progress: number
}

export const initialLoginAnimationState: LoginAnimationState = {
  phase: 'idle',
  progress: 0,
}
