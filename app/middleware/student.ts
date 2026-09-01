export default defineNuxtRouteMiddleware((to) => {
  const { currentAccount } = useAuth()
  if (currentAccount.value?.role !== 'student') return navigateTo({ path: '/forbidden', query: { from: to.fullPath } })
})

