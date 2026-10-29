// The app's source of the current time. Inject a test clock through createApp({ clock }) instead of
// calling new Date() in services, so expiry and cooldown rules can be tested at exact boundaries.
export const systemClock = {
  now: () => new Date(),
};
