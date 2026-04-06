function solve3x3(A: number[][], b: number[]): number[] {
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivotRow][col])) pivotRow = row;
    }
    [m[col], m[pivotRow]] = [m[pivotRow], m[col]];
    if (Math.abs(m[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < 3; row++) {
      const f = m[row][col] / m[col][col];
      for (let j = col; j <= 3; j++) m[row][j] -= f * m[col][j];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    x[i] = m[i][3];
    for (let j = i + 1; j < 3; j++) x[i] -= m[i][j] * x[j];
    if (Math.abs(m[i][i]) > 1e-12) x[i] /= m[i][i];
  }
  return x;
}

export interface BondPoint {
  ticker: string;
  nombre: string;
  duration: number;
  tir: number; // decimal (0.0995)
}

export interface FittedCurve {
  a: number;
  b: number;
  c: number;
  minTir: number;
  maxTir: number;
  predict: (x: number) => number;
}

export function fitYieldCurve(points: BondPoint[]): FittedCurve {
  const n = points.length;
  const minTir = Math.min(...points.map((p) => p.tir));
  const maxTir = Math.max(...points.map((p) => p.tir));

  // Clamped predict: never goes below 0 or outside [minTir*0.5, maxTir*1.5]
  const clamp = (v: number) =>
    Math.max(Math.max(0, minTir * 0.5), Math.min(v, maxTir * 1.5));

  if (n < 3) {
    if (n === 1) {
      const a = points[0].tir;
      return { a, b: 0, c: 0, minTir, maxTir, predict: () => a };
    }
    // Linear fit for 2 points
    const dx = points[1].duration - points[0].duration;
    const b = dx !== 0 ? (points[1].tir - points[0].tir) / dx : 0;
    const a = points[0].tir - b * points[0].duration;
    return { a, b, c: 0, minTir, maxTir, predict: (x) => clamp(a + b * x) };
  }

  // Quadratic OLS for n >= 3 — captures U-shapes (BOPREAL) and proper HD/CER curves.
  // For CER outliers (DICP/PARP at extreme durations) use the interactive toggle to exclude.
  const X = points.map((p) => [1, p.duration, p.duration * p.duration]);
  const y = points.map((p) => p.tir);
  const XtX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const Xty = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < 3; k++) XtX[j][k] += X[i][j] * X[i][k];
    }
  }
  const [a, b, c] = solve3x3(XtX, Xty);
  return { a, b, c, minTir, maxTir, predict: (x) => clamp(a + b * x + c * x * x) };
}

export function generateCurveLine(
  fit: FittedCurve,
  minDur: number,
  maxDur: number,
  steps = 80
): { duration: number; curvaTir: number }[] {
  return Array.from({ length: steps }, (_, i) => {
    const x = minDur + (i / (steps - 1)) * (maxDur - minDur);
    return { duration: +x.toFixed(3), curvaTir: +(fit.predict(x) * 100).toFixed(3) };
  });
}

export function calcSpreadBps(point: BondPoint, fit: FittedCurve): number {
  const fair = fit.predict(point.duration);
  return Math.round((point.tir - fair) * 10000);
}
