export function incidentDetailPath(id: string): string {
  return `/incidents/${encodeURIComponent(id)}`;
}

export function incidentEvidencePath(id: string): string {
  return `/incidents/${encodeURIComponent(id)}/evidence`;
}

export function infrastructureDetailPath(id: string): string {
  return `/infrastructure/${encodeURIComponent(id)}`;
}
