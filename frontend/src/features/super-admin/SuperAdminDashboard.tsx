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
  MoreVertical,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSuperAdminDashboardQuery } from '../../redux/api/superAdminApi';

// Fallback mock stats used when API is not yet wired
const MOCK_STATS = {
  total_businesses: 312,
  active_subscriptions: 278,
  trial_accounts: 24,
  expired_accounts: 8,
  suspended_accounts: 2,
  revenue_this_month: 156000,
  new_signups_this_month: 34,
  plan_breakdown: { starter: 190, pro: 88, trial: 24 },
};

const MOCK_RECENT: Business[] = [
  { id: '1', name: 'Rahman Traders', owner: 'Abdul Rahman', mobile: '01711000001', plan: 'Pro', status: 'active', joinedAt: '2025-05-20' },
  { id: '2', name: 'Karim Store', owner: 'Karim Uddin', mobile: '01811000002', plan: 'Starter', status: 'trial', joinedAt: '2025-06-01' },
  { id: '3', name: 'Dhaka Mart', owner: 'Nasrin Begum', mobile: '01911000003', plan: 'Pro', status: 'active', joinedAt: '2025-05-15' },
  { id: '4', name: 'City Electronics', owner: 'Hasan Ali', mobile: '01611000004', plan: 'Starter', status: 'expired', joinedAt: '2025-03-10' },
  { id: '5', name: 'Green Pharmacy', owner: 'Sumaiya Islam', mobile: '01511000005', plan: 'Starter', status: 'suspended', joinedAt: '2025-04-22' },
];

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
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub?: string;
  trend?: string;
}) => (
  <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#26272F] mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {trend && (
      <div className="flex items-center gap-0.5 text-xs text-green-600 font-medium flex-shrink-0">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {trend}
      </div>
    )}
  </div>
);

const SuperAdminDashboard = () => {
  const { data: apiData } = useGetSuperAdminDashboardQuery(undefined);
  const stats = apiData?.data ?? MOCK_STATS;
  const recentBusinesses: Business[] = apiData?.data?.recentBusinesses ?? MOCK_RECENT;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#26272F]">Platform Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time stats across all tenant businesses</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#DBDFE9] text-sm text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Businesses"
          value={stats.total_businesses}
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          sub="All time registrations"
          trend="+12%"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.active_subscriptions}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          sub="Currently paying"
          trend="+8%"
        />
        <StatCard
          label="Trial Accounts"
          value={stats.trial_accounts}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
          sub="15-day free trial"
        />
        <StatCard
          label="Suspended"
          value={stats.suspended_accounts}
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-red-400"
          sub="Requires attention"
        />
        <StatCard
          label="Revenue This Month"
          value={`৳${stats.revenue_this_month.toLocaleString()}`}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-[#ff6d29]"
          trend="+23%"
        />
        <StatCard
          label="New Sign-ups"
          value={stats.new_signups_this_month}
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          sub="This month"
          trend="+5"
        />
        <StatCard
          label="Expired Accounts"
          value={stats.expired_accounts}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          sub="Need renewal"
        />
      </div>

      {/* Plan breakdown + recent businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plan breakdown */}
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#26272F] mb-4">Plan Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Starter', count: stats.plan_breakdown.starter, color: 'bg-blue-500', total: stats.total_businesses },
              { label: 'Pro', count: stats.plan_breakdown.pro, color: 'bg-purple-500', total: stats.total_businesses },
              { label: 'Trial', count: stats.plan_breakdown.trial, color: 'bg-yellow-400', total: stats.total_businesses },
            ].map(({ label, count, color, total }) => (
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
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link
              to="/super-admin/subscriptions"
              className="text-xs text-[#ff6d29] hover:underline font-medium flex items-center gap-1"
            >
              Manage subscriptions <ArrowUpRight className="h-3 w-3" />
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

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-gray-50">
            {recentBusinesses.slice(0, 5).map((b) => (
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
                    <td className="px-4 py-3 text-gray-400">{new Date(b.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
