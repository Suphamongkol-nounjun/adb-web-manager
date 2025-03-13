const nextConfig = {
    // distDir: process.env.NEXT_PUBLIC_ENV === 'prod'
    // ? 'build/prod'
    // : process.env.NEXT_PUBLIC_ENV === 'uat'
    // ? 'build/uat'
    // : 'build/dev', // Default to 'development'
    output: "standalone",
    reactStrictMode: true,
    experimental: {
    },
  };
  
  export default nextConfig;