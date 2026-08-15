export type LoginSubmission = 'password' | 'google' | null;

export function getLoginSubmissionState(activeSubmission: LoginSubmission) {
  return {
    isBusy: activeSubmission !== null,
    isPasswordLoading: activeSubmission === 'password',
    isGoogleLoading: activeSubmission === 'google',
  };
}
