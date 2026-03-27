import type { InternetStatus } from '../entities/internet'
import type { Monitor } from '../entities/monitor'

type IconState = 'gray' | 'green' | 'red'

interface Palette {
  background: string
  border: string
  stroke: string
}

const PALETTES: Record<IconState, Palette> = {
  gray: {
    background: '#f5f5f0',
    border: '#cccccc',
    stroke: '#cccccc',
  },
  green: {
    background: '#EAF3DE',
    border: '#639922',
    stroke: '#639922',
  },
  red: {
    background: '#FCEBEB',
    border: '#E24B4A',
    stroke: '#E24B4A',
  },
}

function drawRoundedRect(
  context: OffscreenCanvasRenderingContext2D,
  size: number,
  palette: Palette,
) {
  const stroke = Math.max(1.5, size * 0.07)
  const half = stroke / 2
  const w = size - stroke
  const radius = w * 0.22

  context.beginPath()
  context.moveTo(half + radius, half)
  context.arcTo(half + w, half, half + w, half + w, radius)
  context.arcTo(half + w, half + w, half, half + w, radius)
  context.arcTo(half, half + w, half, half, radius)
  context.arcTo(half, half, half + w, half, radius)
  context.closePath()
  context.fillStyle = palette.background
  context.fill()
  context.lineWidth = stroke
  context.strokeStyle = palette.border
  context.stroke()
}

function createIcon(size: number, state: IconState): ImageData | null {
  const canvas = new OffscreenCanvas(size, size)
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  const palette = PALETTES[state]

  const dotStroke = Math.max(1.5, size * 0.07)
  context.clearRect(0, 0, size, size)
  drawRoundedRect(context, size, palette)
  context.beginPath()
  context.arc(size / 2, size / 2, size * 0.22 - dotStroke / 2, 0, Math.PI * 2)
  context.lineWidth = dotStroke
  context.strokeStyle = palette.stroke
  context.stroke()

  return context.getImageData(0, 0, size, size)
}

function getIconState(
  monitors: Monitor[],
  internet: InternetStatus | null,
): { downCount: number; state: IconState } {
  if (monitors.length === 0) {
    return { state: 'gray', downCount: 0 }
  }

  if (internet !== null && internet.lastChecked > 0 && !internet.online) {
    return { state: 'gray', downCount: 0 }
  }

  const downCount = monitors.filter((monitor) => monitor.status === 'down').length

  if (downCount > 0) {
    return { state: 'red', downCount }
  }

  return { state: 'green', downCount: 0 }
}

export function didExtensionIconStateChange(
  previousMonitors: Monitor[],
  nextMonitors: Monitor[],
): boolean {
  const previousIconState = getIconState(previousMonitors, null)
  const nextIconState = getIconState(nextMonitors, null)

  return (
    previousIconState.state !== nextIconState.state ||
    previousIconState.downCount !== nextIconState.downCount
  )
}

export async function updateExtensionIcon(
  monitors: Monitor[],
  internet: InternetStatus,
): Promise<void> {
  const { downCount, state } = getIconState(monitors, internet)
  const image16 = createIcon(16, state)
  const image32 = createIcon(32, state)
  const image48 = createIcon(48, state)
  const image128 = createIcon(128, state)

  if (image16 && image32 && image48 && image128) {
    await chrome.action.setIcon({
      imageData: {
        16: image16,
        32: image32,
        48: image48,
        128: image128,
      },
    })
  }

  await chrome.action.setBadgeBackgroundColor({ color: '#ba3f3e' })
  await chrome.action.setBadgeText({
    text: downCount > 0 ? String(Math.min(downCount, 99)) : '',
  })
}
