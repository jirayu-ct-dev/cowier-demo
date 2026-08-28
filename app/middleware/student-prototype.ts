export default defineNuxtRouteMiddleware(() => {
  const { scenario } = useScenario()
  if (scenario.value.role !== 'student') {
    scenario.value.role = 'student'
    scenario.value.userName = 'นายธนกฤต พูนทรัพย์'
  }
})
