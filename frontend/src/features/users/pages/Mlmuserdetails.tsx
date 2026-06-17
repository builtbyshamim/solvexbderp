// ===== MlmUserDetails.tsx =====
// Route: /admin/manage-users/mlm/:userId
// Shows: Binary Tree, Binary Stats, Binary Level Count, Matrix Tree, Referral Summary

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUsers,
  FiGitBranch,
  FiGrid,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle,
  FiUser,
  FiBarChart2,
  FiLink,
} from 'react-icons/fi';
import {
  useGetBinaryTreeQuery,
  useGetBinaryStatsQuery,
  useCountBinaryLevelQuery,
  useGetMatrixTreeQuery,
  useGetReferralSummaryQuery,
} from '../mlmApi';

// ─── RTK Query API Slice (Create this in your project) ──────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────
interface BinaryNode {
  userId: string;
  name: string | null;
  email: string | null;
  referralCode: string | null;
  position: 'LEFT' | 'RIGHT' | null;
  level: number;
  generation: number;
  left: BinaryNode | null;
  right: BinaryNode | null;
}

interface MatrixNode {
  userId: string;
  email: string | null;
  referralCode: string | null;
  level: number;
  positionIndex: number;
  depth: number;
  children: MatrixNode[];
}

interface LevelStat {
  level: number;
  count: number;
}

interface ReferralSummary {
  totalReferrals: number;
  directReferrals: number;
  referrals: {
    id: string;
    referredUserId: string;
    referralCode: string;
    createdAt: string;
    referredUser?: { email: string; name?: string };
  }[];
}

// ─── API Response Types ───────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'binary-tree', label: 'Binary Tree', icon: FiGitBranch },
  { id: 'binary-stats', label: 'Level Stats', icon: FiBarChart2 },
  { id: 'matrix-tree', label: 'Matrix Tree', icon: FiGrid },
  { id: 'referrals', label: 'Referrals', icon: FiLink },
] as const;
type TabId = (typeof TABS)[number]['id'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

// ─── Error State ──────────────────────────────────────────────────────────────
const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Failed to load data.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <FiAlertCircle size={32} className="text-red-400" />
    <p className="text-gray-500 text-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn text-sm px-4 py-1.5 flex items-center gap-1">
        <FiRefreshCw size={13} /> Retry
      </button>
    )}
  </div>
);

// ─── Binary Tree Node ─────────────────────────────────────────────────────────
const BinaryNodeCard: React.FC<{ node: BinaryNode; isRoot?: boolean }> = ({ node, isRoot }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.left || node.right;

  const positionColor =
    node.position === 'LEFT'
      ? 'bg-blue-100 text-blue-700'
      : node.position === 'RIGHT'
        ? 'bg-purple-100 text-purple-700'
        : 'bg-gray-100 text-gray-500';

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className={`relative border rounded-xl px-3 py-2.5 text-center shadow-sm min-w-[130px] max-w-[160px] cursor-pointer transition-all hover:shadow-md
          ${isRoot ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}`}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1">
          <FiUser size={14} className="text-gray-500" />
        </div>
        <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">
          {node.name || node.email?.split('@')[0] || 'Unknown'}
        </p>
        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{node.email}</p>
        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
          <span className="text-[9px] bg-gray-50 border border-gray-200 text-gray-500 rounded px-1 py-0.5">
            L{node.level}
          </span>
          {node.position && (
            <span className={`text-[9px] rounded px-1 py-0.5 font-medium ${positionColor}`}>
              {node.position}
            </span>
          )}
          {isRoot && (
            <span className="text-[9px] bg-orange-100 text-orange-600 rounded px-1 py-0.5 font-semibold">
              ROOT
            </span>
          )}
        </div>
        {hasChildren && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center z-10">
            <FiChevronRight
              size={11}
              className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : 'rotate-0'}`}
            />
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="flex items-start mt-6 gap-4 md:gap-8 relative">
          {/* Horizontal connector line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-gray-200"
            style={{ width: node.left && node.right ? '60%' : '1px' }}
          />
          {node.left && (
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-200" />
              <BinaryNodeCard node={node.left} />
            </div>
          )}
          {/* Slot placeholder if missing */}
          {!node.left && node.right && (
            <div className="flex flex-col items-center opacity-30">
              <div className="w-px h-4 bg-gray-200" />
              <div className="border-2 border-dashed border-gray-300 rounded-xl px-3 py-2.5 min-w-[130px] text-center">
                <p className="text-[10px] text-gray-400">Empty LEFT</p>
              </div>
            </div>
          )}
          {node.right && (
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-200" />
              <BinaryNodeCard node={node.right} />
            </div>
          )}
          {!node.right && node.left && (
            <div className="flex flex-col items-center opacity-30">
              <div className="w-px h-4 bg-gray-200" />
              <div className="border-2 border-dashed border-gray-300 rounded-xl px-3 py-2.5 min-w-[130px] text-center">
                <p className="text-[10px] text-gray-400">Empty RIGHT</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Matrix Tree Node ─────────────────────────────────────────────────────────
const MatrixNodeCard: React.FC<{ node: MatrixNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const colors = [
    'bg-teal-50 border-teal-200',
    'bg-blue-50 border-blue-200',
    'bg-purple-50 border-purple-200',
    'bg-pink-50 border-pink-200',
  ];
  const color = colors[depth % colors.length];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`border rounded-xl px-3 py-2.5 text-center shadow-sm min-w-[120px] max-w-[150px] cursor-pointer transition-all hover:shadow-md ${color}`}
        onClick={() => node.children.length > 0 && setExpanded((e) => !e)}
      >
        <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-1">
          <FiUser size={12} className="text-gray-500" />
        </div>
        <p className="text-xs font-semibold text-gray-800 truncate max-w-[110px]">
          {node.email?.split('@')[0] || 'Unknown'}
        </p>
        <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{node.email}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-[9px] bg-white/60 border border-gray-200 text-gray-500 rounded px-1 py-0.5">
            L{node.level}
          </span>
          <span className="text-[9px] bg-white/60 border border-gray-200 text-gray-500 rounded px-1 py-0.5">
            #{node.positionIndex}
          </span>
        </div>
      </div>

      {node.children.length > 0 && expanded && (
        <div className="flex items-start mt-5 gap-3 flex-wrap justify-center">
          {node.children.map((child) => (
            <div key={child.userId} className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-200" />
              <MatrixNodeCard node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level Stats Bar Chart ────────────────────────────────────────────────────
const LevelStatsChart: React.FC<{ stats: LevelStat[]; type: 'binary' | 'matrix' }> = ({
  stats,
  type,
}) => {
  const max = Math.max(...stats.map((s) => s.count), 1);
  const totalUsers = stats.reduce((a, b) => a + b.count, 0);

  const barColor = type === 'binary' ? 'bg-blue-500' : 'bg-teal-500';
  const textColor = type === 'binary' ? 'text-blue-600' : 'text-teal-600';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>{stats.length} levels tracked</span>
        <span className={`font-semibold ${textColor}`}>{totalUsers} total users</span>
      </div>
      {stats.map(({ level, count }) => (
        <div key={level} className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 w-14 shrink-0">Level {level}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
              {count} user{count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Level Count Query Panel ──────────────────────────────────────────────────
const BinaryLevelCount: React.FC<{ userId: string }> = ({ userId }) => {
  const [level, setLevel] = useState(1);
  const { data, isFetching } = useCountBinaryLevelQuery(
    { userId, level },
    { skip: !userId || level < 1 },
  );

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Count Users at Specific Level</h4>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Level</label>
          <input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2">
          {isFetching ? (
            <Skeleton className="w-12 h-5" />
          ) : (
            <>
              <span className="text-2xl font-bold text-blue-600">{data?.data?.count ?? 0}</span>
              <span className="text-xs text-blue-400">users at level {level}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Referral List ────────────────────────────────────────────────────────────
const ReferralList: React.FC<{ summary: ReferralSummary }> = ({ summary }) => (
  <div className="space-y-4">
    {/* Summary cards */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-orange-600">{summary.totalReferrals}</p>
        <p className="text-xs text-orange-400 mt-1">Total Referrals</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-blue-600">{summary.directReferrals}</p>
        <p className="text-xs text-blue-400 mt-1">Direct Referrals</p>
      </div>
    </div>

    {/* Table */}
    {summary.referrals.length > 0 ? (
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="table w-full text-sm">
          <thead>
            <tr className="table-row">
              <th>#</th>
              <th>User</th>
              <th>Referral Code</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {summary.referrals.map((r, i) => (
              <tr key={r.id}>
                <td className="text-gray-400">{i + 1}</td>
                <td>
                  <div>
                    <p className="font-medium text-gray-800">
                      {r.referredUser?.name || r.referredUser?.email?.split('@')[0] || '—'}
                    </p>
                    <p className="text-xs text-gray-400">{r.referredUser?.email}</p>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-xs bg-gray-100 rounded px-2 py-0.5">
                    {r.referralCode}
                  </span>
                </td>
                <td className="text-gray-500 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-10 text-gray-400 text-sm">No referrals yet</div>
    )}
  </div>
);

// ─── Helper: count matrix nodes at a specific depth ───────────────────────────
function countMatrixAtDepth(
  node: MatrixNode | null,
  targetDepth: number,
  currentDepth = 0,
): number {
  if (!node) return 0;
  if (currentDepth === targetDepth) return 1;
  return node.children.reduce(
    (sum, child) => sum + countMatrixAtDepth(child, targetDepth, currentDepth + 1),
    0,
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MlmUserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  console.log('MLM User ID from URL:', userId); // Debug log to verify userId
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('binary-tree');
  const [binaryDepth, setBinaryDepth] = useState(3);
  const [matrixDepth, setMatrixDepth] = useState(3);

  // ── RTK Query hooks with depth parameters ───────────────────────────────────
  const {
    data: binaryTreeData,
    isFetching: binaryTreeFetching,
    isError: binaryTreeError,
    refetch: refetchBinaryTree,
  } = useGetBinaryTreeQuery({ userId: userId!, depth: binaryDepth }, { skip: !userId });

  const {
    data: binaryStatsData,
    isFetching: binaryStatsFetching,
    isError: binaryStatsError,
    refetch: refetchBinaryStats,
  } = useGetBinaryStatsQuery({ userId: userId! }, { skip: !userId });

  const {
    data: matrixTreeData,
    isFetching: matrixTreeFetching,
    isError: matrixTreeError,
    refetch: refetchMatrixTree,
  } = useGetMatrixTreeQuery({ userId: userId!, depth: matrixDepth }, { skip: !userId });

  const {
    data: referralData,
    isFetching: referralFetching,
    isError: referralError,
    refetch: refetchReferral,
  } = useGetReferralSummaryQuery({ userId: userId! }, { skip: !userId });

  // Extract data from API responses
  const binaryNode = (binaryTreeData as ApiResponse<BinaryNode>)?.data;
  const bStatsArr = (binaryStatsData as ApiResponse<LevelStat[]>)?.data;
  const matrixNode = (matrixTreeData as ApiResponse<MatrixNode>)?.data;
  const refSummary = (referralData as ApiResponse<ReferralSummary>)?.data;

  // ── Depth change handlers ───────────────────────────────────────────────────
  const handleBinaryDepth = (d: number) => {
    setBinaryDepth(d);
  };
  const handleMatrixDepth = (d: number) => {
    setMatrixDepth(d);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">MLM Network Details</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{userId}</p>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Total Referrals',
              value: refSummary?.totalReferrals ?? '—',
              icon: FiUsers,
              color: 'text-orange-500',
              bg: 'bg-orange-50',
            },
            {
              label: 'Direct Referrals',
              value: refSummary?.directReferrals ?? '—',
              icon: FiLink,
              color: 'text-blue-500',
              bg: 'bg-blue-50',
            },
            {
              label: 'Binary Levels',
              value: bStatsArr?.length ?? '—',
              icon: FiGitBranch,
              color: 'text-purple-500',
              bg: 'bg-purple-50',
            },
            {
              label: 'Matrix Depth',
              value: matrixDepth,
              icon: FiGrid,
              color: 'text-teal-500',
              bg: 'bg-teal-50',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-gray-800">{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${
                  activeTab === id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6">
          {/* Binary Tree Tab */}
          {activeTab === 'binary-tree' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Binary Tree</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Left / Right placement structure</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Depth</label>
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    value={binaryDepth}
                    onChange={(e) => handleBinaryDepth(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>
                        {d} levels
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refetchBinaryTree}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <FiRefreshCw
                      size={14}
                      className={`text-gray-400 ${binaryTreeFetching ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 flex-wrap mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />{' '}
                  Left child
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300 inline-block" />{' '}
                  Right child
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-50 border border-orange-300 inline-block" />{' '}
                  Root node
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 inline-block" />{' '}
                  Empty slot
                </div>
              </div>

              {binaryTreeError && <ErrorState onRetry={refetchBinaryTree} />}

              {binaryTreeFetching && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Skeleton className="w-36 h-16" />
                  <div className="flex gap-8">
                    <Skeleton className="w-28 h-14" />
                    <Skeleton className="w-28 h-14" />
                  </div>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="w-24 h-12" />
                    ))}
                  </div>
                </div>
              )}

              {!binaryTreeFetching && binaryNode && (
                <div className="overflow-x-auto pb-6">
                  <div className="flex justify-center min-w-max">
                    <BinaryNodeCard node={binaryNode} isRoot />
                  </div>
                </div>
              )}

              {!binaryTreeFetching && !binaryNode && !binaryTreeError && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No binary tree data found.
                </div>
              )}
            </div>
          )}

          {/* Binary Stats Tab */}
          {activeTab === 'binary-stats' && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-800">Level Statistics</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  User count per depth level in the binary tree
                </p>
              </div>

              {binaryStatsError && <ErrorState onRetry={refetchBinaryStats} />}

              {binaryStatsFetching && (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-14 h-4" />
                      <Skeleton className="flex-1 h-6" />
                    </div>
                  ))}
                </div>
              )}

              {!binaryStatsFetching && bStatsArr && bStatsArr.length > 0 && (
                <>
                  <LevelStatsChart stats={bStatsArr} type="binary" />
                  <BinaryLevelCount userId={userId!} />
                </>
              )}

              {!binaryStatsFetching &&
                (!bStatsArr || bStatsArr.length === 0) &&
                !binaryStatsError && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No level stats available.
                  </div>
                )}
            </div>
          )}

          {/* Matrix Tree Tab */}
          {activeTab === 'matrix-tree' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Matrix Tree</h2>
                  <p className="text-xs text-gray-400 mt-0.5">3×N forced matrix placement</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Depth</label>
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    value={matrixDepth}
                    onChange={(e) => handleMatrixDepth(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {d} levels
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refetchMatrixTree}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <FiRefreshCw
                      size={14}
                      className={`text-gray-400 ${matrixTreeFetching ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Matrix Level Stats bar */}
              {matrixNode && (
                <div className="bg-gray-50 rounded-xl p-3 mb-5">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Matrix Level Stats</p>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: matrixDepth }, (_, i) => {
                      const countAtLevel = countMatrixAtDepth(matrixNode, i + 1);
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center bg-white border border-gray-100 rounded-lg px-3 py-2 min-w-[64px]"
                        >
                          <span className="text-lg font-bold text-teal-600">{countAtLevel}</span>
                          <span className="text-[10px] text-gray-400">Level {i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matrixTreeError && <ErrorState onRetry={refetchMatrixTree} />}

              {matrixTreeFetching && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Skeleton className="w-32 h-14" />
                  <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-24 h-12" />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <Skeleton key={i} className="w-20 h-10" />
                    ))}
                  </div>
                </div>
              )}

              {!matrixTreeFetching && matrixNode && (
                <div className="overflow-x-auto pb-6">
                  <div className="flex justify-center min-w-max">
                    <MatrixNodeCard node={matrixNode} depth={0} />
                  </div>
                </div>
              )}

              {!matrixTreeFetching && !matrixNode && !matrixTreeError && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No matrix tree data found.
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-800">Referral Network</h2>
                <p className="text-xs text-gray-400 mt-0.5">Direct referrals and summary</p>
              </div>

              {referralError && <ErrorState onRetry={refetchReferral} />}

              {referralFetching && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-xl" />
                  ))}
                </div>
              )}

              {!referralFetching && refSummary && <ReferralList summary={refSummary} />}

              {!referralFetching && !refSummary && !referralError && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No referral data available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MlmUserDetails;
