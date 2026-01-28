
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { Layout } from "./components/Layout";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://cdn.tailwindcss.com" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" },
];

export default function App() {
  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          body { background-color: #f9fafb; font-family: 'Noto Sans TC', sans-serif; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
          .animate-marquee { animation: marquee linear infinite; }
        `}</style>
      </head>
      <body>
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
