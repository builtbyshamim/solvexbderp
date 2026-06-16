import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSuperAdminDashboardQuery } from '../../redux/api/superAdminApi';

interface Business {
  id: string;
  name: string;
  owner: string;
  mobile: string;
  plan: string;
  status: string;
  joinedAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-600',
    suspended: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) => (
  <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#26272F] mt-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 flex items-start gap-4 animate-pulse">
    <div className="h-10 w-10 rounded-xl bg-gray-100 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-24 bg-gray-100 rounded" />
      <div className="h-7 w-16 bg-gray-200 rounded" />
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const { data: apiData, isLoading, isFetching, refetch } = useGetSuperAdminDashboardQuery(undefined);
  const stats = apiData?.data;
  const recentBusinesses: Business[] = stats?.recentBusinesses ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#26272F]">Platform Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time stats across all tenant businesses</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#DBDFE9] text-sm text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Businesses"
              value={stats?.total_businesses ?? 0}
              icon={Building2}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              sub="All time registrations"
            />
            <StatCard
              label="Active Businesses"
              value={stats?.active_subscriptions ?? 0}
              icon={CheckCircle}
              iconBg="bg-green-50"
              iconColor="text-green-500"
              sub="Currently active"
            />
            <StatCard
              label="Trial Accounts"
              value={stats?.trial_accounts ?? 0}
              icon={Clock}
              iconBg="bg-yellow-50"
              iconColor="text-yellow-500"
              sub="15-day free trial"
            />
            <StatCard
              label="Suspended"
              value={stats?.suspended_accounts ?? 0}
              icon={XCircle}
              iconBg="bg-red-50"
              iconColor="text-red-400"
              sub="Requires attention"
            />
            <StatCard
              label="Revenue This Month"
              value={`৳${(stats?.revenue_this_month ?? 0).toLocaleString()}`}
              icon={TrendingUp}
              iconBg="bg-orange-50"
              iconColor="text-[#ff6d29]"
            />
            <StatCard
              label="New Sign-ups"
              value={stats?.new_signups_this_month ?? 0}
              icon={Users}
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
              sub="This month"
            />
            <StatCard
              label="Expired Accounts"
              value={stats?.expired_accounts ?? 0}
              icon={AlertTriangle}
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              sub="Need renewal"
            />
          </>
        )}
      </div>

      {/* Plan breakdown + recent businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plan breakdown */}
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#26272F] mb-4">Plan Breakdown</h3>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
                  <div className="h-2 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Starter', count: stats?.plan_breakdown?.starter ?? 0, color: 'bg-blue-500' },
                { label: 'Pro', count: stats?.plan_breakdown?.pro ?? 0, color: 'bg-purple-500' },
                { label: 'Trial', count: stats?.plan_breakdown?.trial ?? 0, color: 'bg-yellow-400' },
              ].map(({ label, count, color }) => {
                const total = stats?.total_businesses || 1;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="font-semibold text-[#26272F]">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link
              to="/super-admin/businesses"
              className="text-xs text-[#ff6d29] hover:underline font-medium flex items-center gap-1"
            >
              Manage businesses <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Recent businesses */}
        <div className="lg:col-span-2 bg-white border border-[#DBDFE9] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#26272F]">Recent Businesses</h3>
            <Link
              to="/super-admin/businesses"
              className="text-xs text-[#ff6d29] hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-50 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                    <div className="h-2.5 w-24 bg-gray-50 rounded" />
                  </div>
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentBusinesses.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Building2 className="h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No businesses yet</p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-gray-50">
                {recentBusinesses.map((b) => (
                  <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#ff6d29] font-bold text-xs">{b.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#26272F] truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.owner} · {b.plan}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Business</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#ff6d29] font-bold text-xs">{b.name[0]}</span>
                            </div>
                            <span className="font-medium text-[#26272F]">{b.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{b.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.plan === 'Pro' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {b.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3 text-gray-400">
                          {b.joinedAt ? new Date(b.joinedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
