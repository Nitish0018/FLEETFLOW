/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fleetflow-uploads.s3.amazonaws.com',
            },
        ],
    },
};

export default nextConfig;
