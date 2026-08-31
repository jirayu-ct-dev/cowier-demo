export default defineNuxtRouteMiddleware((to) => {
  const { scenario } = useScenario()
  const isStaff = to.path.startsWith('/staff/applications')
  const role = isStaff ? 'staff' : 'lecturer'

  if (scenario.value.role !== role) {
    scenario.value.role = role
    scenario.value.userName = isStaff ? 'นางสาวพิมพ์ชนก ใจดี' : 'อาจารย์ผู้ตรวจคำร้อง'
  }
})
