import { AUTH_PATHS } from '../routes.jsx';

// Where an Account lands after log in or email verification.
// Minimal rule until Q-034 is answered (TASK-041 replaces this function): a Developer continues to
// Professional info, everyone else to Select a country.
export const landingPathFor = (user) =>
  user?.roles?.includes('developer') ? AUTH_PATHS.professionalInfo : AUTH_PATHS.selectCountry;
