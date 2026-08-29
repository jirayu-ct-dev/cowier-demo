export default defineNuxtRouteMiddleware(() => {
  const { scenario } = useScenario()
  if (scenario.value.role !== 'staff') {
    scenario.value.role = 'staff'
    scenario.value.userName = 'นางสาวพิมพ์ชนก ใจดี'
  }
})
