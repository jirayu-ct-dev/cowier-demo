export default defineNuxtRouteMiddleware((to) => {
  const { currentAccount } = useAuth()
  if (currentAccount.value?.role !== 'lecturer') return navigateTo({ path: '/forbidden', query: { from: to.fullPath } })
  if (to.path.startsWith('/lecturer/placements') && !currentAccount.value.canReviewPlacements) {
    return navigateTo({ path: '/forbidden', query: { from: to.fullPath } })
  }
})

