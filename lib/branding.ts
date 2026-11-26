// Bump only when publishing an installation icon revision. Keep the manifest ID stable.
export const installationIconRevision='blue-20261126';
export function installationIcon(file:string){return `/branding/${file}?v=${installationIconRevision}`}
