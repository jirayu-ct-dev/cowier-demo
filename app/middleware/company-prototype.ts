export default defineNuxtRouteMiddleware((to) => {
  const { scenario } = useScenario()
  if (to.path.startsWith('/lecturer/companies')) scenario.value.role = 'lecturer'
  if (to.path.startsWith('/staff/companies')) scenario.value.role = 'staff'
  if (scenario.value.role === 'student') return navigateTo('/')
})
