export default defineNuxtRouteMiddleware(() => {
  const { scenario } = useScenario()
  if (scenario.value.role !== 'lecturer') {
    scenario.value.role = 'lecturer'
    scenario.value.userName = 'อาจารย์ผู้ตรวจคำร้อง'
  }
})
