import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getUser } from '~/services/auth.server';
import { parsePermissions, ROUTE_PERMISSIONS } from '~/utils/permissions';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return json({ error: '未登入' });
  }
  
  const permissions = parsePermissions(user.permissions);
  
  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissionsRaw: user.permissions,
      permissionsParsed: permissions,
    },
    routePermissions: ROUTE_PERMISSIONS,
  });
}

export default function DebugPermissions() {
  const data = useLoaderData<typeof loader>();
  
  if ('error' in data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">錯誤</h1>
        <p>{data.error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">權限診斷頁面</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">用戶資訊</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>ID:</strong> {data.user.id}</p>
              <p><strong>Email:</strong> {data.user.email}</p>
              <p><strong>Name:</strong> {data.user.name}</p>
              <p><strong>Role:</strong> {data.user.role}</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">權限資料（原始）</h2>
            <div className="bg-blue-100 p-4 rounded">
              <pre className="text-sm overflow-auto">{data.user.permissionsRaw || 'null'}</pre>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">權限資料（解析後）</h2>
            <div className="bg-green-100 p-4 rounded">
              <pre className="text-sm overflow-auto">{JSON.stringify(data.user.permissionsParsed, null, 2)}</pre>
              <p className="mt-2"><strong>數量:</strong> {data.user.permissionsParsed.length}</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">路由權限映射</h2>
            <div className="bg-yellow-100 p-4 rounded">
              <pre className="text-sm overflow-auto">{JSON.stringify(data.routePermissions, null, 2)}</pre>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">權限檢查結果</h2>
            <div className="space-y-2">
              {Object.entries(data.routePermissions).map(([route, permission]) => {
                const hasPermission = data.user.permissionsParsed.includes(permission);
                return (
                  <div key={route} className={`p-3 rounded ${hasPermission ? 'bg-green-200' : 'bg-red-200'}`}>
                    <p><strong>路由:</strong> {route}</p>
                    <p><strong>需要權限:</strong> {permission}</p>
                    <p><strong>是否擁有:</strong> {hasPermission ? '✅ 是' : '❌ 否'}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
