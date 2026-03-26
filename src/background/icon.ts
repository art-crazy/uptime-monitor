import type { Monitor } from '../entities/monitor'

type IconState = 'gray' | 'green' | 'red'

interface Palette {
  background: string
  border: string
  stroke: string
}

const PALETTES: Record<IconState, Palette> = {
  gray: {
    background: '#f2efe7',
    border: '#c7beb0',
    stroke: '#958d7f',
  },
  green: {
    background: '#e7f1d8',
    border: '#76a63c',
    stroke: '#4f8529',
  },
  red: {
    background: '#f8e1df',
    border: '#d15e5c',
    stroke: '#ba3f3e',
  },
}

function drawRoundedRect(
  context: OffscreenCanvasRenderingContext2D,
  size: number,
  palette: Palette,
) {
  const inset = size * 0.1
  const radius = size * 0.24
  const dimension = size - inset * 2

  context.beginPath()
  context.moveTo(inset + radius, inset)
  context.arcTo(inset + dimension, inset, inset + dimension, inset + dimension, radius)
  context.arcTo(
    inset + dimension,
    inset + dimension,
    inset,
    inset + dimension,
    radius,
  )
  context.arcTo(inset, inset + dimension, inset, inset, radius)
  context.arcTo(inset, inset, inset + dimension, inset, radius)
  context.closePath()
  context.fillStyle = palette.background
  context.fill()
  context.lineWidth = Math.max(1, size * 0.08)
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

  context.clearRect(0, 0, size, size)
  drawRoundedRect(context, size, palette)
  context.beginPath()
  context.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2)
  context.lineWidth = Math.max(1.5, size * 0.12)
  context.strokeStyle = palette.stroke
  context.stroke()

  return context.getImageData(0, 0, size, size)
}

function getIconState(monitors: Monitor[]): { downCount: number; state: IconState } {
  if (monitors.length === 0) {
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
  const previousIconState = getIconState(previousMonitors)
  const nextIconState = getIconState(nextMonitors)

  return (
    previousIconState.state !== nextIconState.state ||
    previousIconState.downCount !== nextIconState.downCount
  )
}

export async function updateExtensionIcon(monitors: Monitor[]): Promise<void> {
  const { downCount, state } = getIconState(monitors)
  const image16 = createIcon(16, state)
  const image32 = createIcon(32, state)

  if (image16 && image32) {
    await chrome.action.setIcon({
      imageData: {
        16: image16,
        32: image32,
      },
    })
  }

  await chrome.action.setBadgeBackgroundColor({ color: '#ba3f3e' })
  await chrome.action.setBadgeText({
    text: downCount > 0 ? String(Math.min(downCount, 99)) : '',
  })
}
