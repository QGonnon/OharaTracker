import { defineComponent, onMounted, onBeforeUnmount, ref } from 'vue'

export default defineComponent({
  name: 'Menu',
  setup() {
    const isShrunk = ref(false)
    const activeDropdown = ref<string | null>(null)

    const handleScroll = () => {
      isShrunk.value = window.scrollY > 50
    }

    const toggleDropdown = (name: string | null) => {
      activeDropdown.value = name
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isShrunk,
      activeDropdown,
      toggleDropdown
    }
  }
})