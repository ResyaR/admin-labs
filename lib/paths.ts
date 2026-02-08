// Get base path from environment variable
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Helper for API calls - use this for all fetch
export const apiUrl = (path: string) => `${basePath}${path}`;

// Helper for asset paths
export const assetUrl = (path: string) => `${basePath}${path}`;
