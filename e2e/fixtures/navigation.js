/* global window -- the page.evaluate callback runs in the browser */

// Opens `path` inside the running app, like a link would: the session lives only in memory (Redux), so
// page.goto (a full reload) would sign the user out. Needed until post-login routing (TASK-041, Q-034)
// takes a Developer to the right screen by itself; today Log in always opens Professional info.
export async function openInApp(page, path) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
  }, path);
}
