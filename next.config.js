/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  // Your app uses API routes which require server-side rendering
  images: { 
    unoptimized: true 
  },
  // Optional: Add a trailing slash to all paths
  // trailingSlash: true,
};

module.exports = nextConfig;
