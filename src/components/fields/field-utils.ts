export function numberProp(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function finiteNumberUpdater(apply: (value: number) => void): (value: number | null) => void {
  return (value) => {
    if (typeof value === "number" && Number.isFinite(value)) apply(value);
  };
}
