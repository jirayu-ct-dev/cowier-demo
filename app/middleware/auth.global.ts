export default defineNuxtRouteMiddleware(async (to) => {
  const { ready, authenticated, currentAccount, refresh } = useAuth()
  if (!ready.value) await refresh()
  const isLoginPage = to.path === '/login'

  if (!authenticated.value || !currentAccount.value) {
    if (isLoginPage) return
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const requiresPasswordChange = currentAccount.value.status === 'first-login'
  if (requiresPasswordChange && to.path !== '/first-login') return navigateTo('/first-login')
  if (!requiresPasswordChange && to.path === '/first-login') return navigateTo('/')
  if (isLoginPage) return navigateTo(requiresPasswordChange ? '/first-login' : '/')
})
