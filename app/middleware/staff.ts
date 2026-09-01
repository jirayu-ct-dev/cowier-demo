export default defineNuxtRouteMiddleware((to) => {
  const { currentAccount } = useAuth()
  if (currentAccount.value?.role !== 'staff') return navigateTo({ path: '/forbidden', query: { from: to.fullPath } })
})

