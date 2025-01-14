import parse from '@kurkle/color'

export default function normalizeColor(color: string) {
  const parsed = parse(color)

  if (!parsed.valid) {
    return {
      color: '#fff',
      alpha: 1,
    }
  }

  return {
    color: parsed.clone().alpha(1).hexString(),
    alpha: parsed.rgb.a,
  }
}
