export interface ColorsInterpolateOptions {
  colorStart: number;
  colorEnd: number;
  useEndAsStart: boolean;
}

function calculatePoint(
  i: number,
  intervalSize: number,
  colorInterpolateOptions: ColorsInterpolateOptions,
): number {
  return colorInterpolateOptions.useEndAsStart
    ? colorInterpolateOptions.colorEnd - i * intervalSize
    : colorInterpolateOptions.colorStart + i * intervalSize;
}

export function interpolateColors(
  dataLength: number,
  colorScale: (point: number) => string,
  colorInterpolateOptions: ColorsInterpolateOptions,
): string[] {
  const { colorStart, colorEnd } = colorInterpolateOptions;
  const colorRange = colorEnd - colorStart;
  const intervalSize = colorRange / dataLength;
  const colorArray = [];

  let i, colorPoint;
  for (i = 0; i < dataLength; i++) {
    colorPoint = calculatePoint(i, intervalSize, colorInterpolateOptions);
    colorArray.push(colorScale(colorPoint));
  }

  return colorArray;
}
