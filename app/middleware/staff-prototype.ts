export default defineNuxtRouteMiddleware(() => {
  const { scenario } = useScenario()
  if (scenario.value.role !== 'staff') {
    scenario.value.role = 'staff'
    scenario.value.userName = 'เจ้าหน้าที่งานสหกิจศึกษา'
  }
})
