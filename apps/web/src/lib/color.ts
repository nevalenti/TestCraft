type Rgb = [number, number, number];

const SURFACE: Rgb = [40, 42, 54];
const LIGHT: Rgb = [248, 248, 242];
const MIN_TEXT_CONTRAST = 4.5;
const HEX_COLOR = /^#([0-9a-f]{6})$/i;

const parseHex = (color: string): Rgb | null => {
  const match = HEX_COLOR.exec(color);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = ([red, green, blue]: Rgb) =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const channelLuminance = (channel: number) => {
  const value = channel / 255;

  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = ([red, green, blue]: Rgb) =>
  0.2126 * channelLuminance(red) +
  0.7152 * channelLuminance(green) +
  0.0722 * channelLuminance(blue);

export const contrastRatio = (first: Rgb, second: Rgb) => {
  const [lighter, darker] = [luminance(first), luminance(second)].toSorted(
    (a, b) => b - a,
  );

  return (lighter + 0.05) / (darker + 0.05);
};

export const readableOnSurface = (color: string) => {
  const rgb = parseHex(color);
  if (!rgb) return color;

  for (let step = 0; step <= 20; step++) {
    const amount = step / 20;
    const mixed = rgb.map(
      (channel, index) => channel + (LIGHT[index] - channel) * amount,
    ) as Rgb;
    if (contrastRatio(mixed, SURFACE) >= MIN_TEXT_CONTRAST)
      return step === 0 ? color : toHex(mixed);
  }

  return toHex(LIGHT);
};
