// DATETIME columns keep whole seconds (MySQL rounds a fraction). Working in whole seconds means a stored
// time is exactly the one computed, so expiry and "latest" comparisons hold however the driver treats a
// fraction.
export const toWholeSeconds = (date) => new Date(Math.floor(date.getTime() / 1000) * 1000);
