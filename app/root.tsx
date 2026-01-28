import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { Layout } from "./components/Layout";
import stylesheet from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" },
];

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-50 font-sans">
        <div className="h-screen flex flex-col items-center justify-center text-slate-600">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-md">
            <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              {isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : "系統發生錯誤"}
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {isRouteErrorResponse(error) 
                ? error.data 
                : "很抱歉，應用程式遇到未預期的錯誤。請嘗試重新整理頁面。"}
            </p>
            <a 
              href="/"
              className="inline-block px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-bold"
            >
              返回首頁
            </a>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PartnerLink Pro - 協力廠商戰情室</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-50 font-sans">
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
