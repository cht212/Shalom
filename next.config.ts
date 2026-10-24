import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers(){return [
    {source:'/sw.js',headers:[{key:'Cache-Control',value:'no-store, max-age=0'},{key:'Service-Worker-Allowed',value:'/'},{key:'Content-Type',value:'application/javascript; charset=utf-8'},{key:'X-Content-Type-Options',value:'nosniff'}]},
    {source:'/pwa-build.js',headers:[{key:'Cache-Control',value:'no-store, max-age=0'}]},
    {source:'/api/:path*',headers:[{key:'Cache-Control',value:'no-store, private'}]},
  ]},
};

export default nextConfig;
