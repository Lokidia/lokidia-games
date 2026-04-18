import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/jeux/:genre((?!categorie|selection)[^/]+)",
        destination: "/jeux/categorie/:genre",
        permanent: true,
      },
      {
        source: "/jeux/:genre((?!categorie|selection)[^/]+)/:joueurs",
        destination: "/jeux/categorie/:genre",
        permanent: true,
      },
      {
        source: "/jeux/:genre((?!categorie|selection)[^/]+)/:joueurs/:duree",
        destination: "/jeux/categorie/:genre",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "cf.geekdo-images.com" },
      { protocol: "https", hostname: "*.geekdo-images.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "*.media-amazon.com" },
    ],
  },
};

export default nextConfig;