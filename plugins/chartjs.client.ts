import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'

export default defineNuxtPlugin(() => {
  Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Filler,
    Legend,
    Tooltip
  )

  Chart.defaults.color = '#6f6a5c'
  Chart.defaults.borderColor = 'rgba(28, 27, 24, 0.08)'
  Chart.defaults.font.family = "'Space Mono', 'Courier New', monospace"
  Chart.defaults.font.size = 11
  Chart.defaults.animation = { duration: 900, easing: 'easeOutQuart' }
  Chart.defaults.plugins.tooltip.backgroundColor = '#1c1b18'
  Chart.defaults.plugins.tooltip.titleColor = '#f4f2ec'
  Chart.defaults.plugins.tooltip.bodyColor = '#f4f2ec'
  Chart.defaults.plugins.tooltip.padding = 10
  Chart.defaults.plugins.tooltip.cornerRadius = 2
  Chart.defaults.plugins.tooltip.displayColors = false
})
