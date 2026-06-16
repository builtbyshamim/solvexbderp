import { useMemo } from 'react';
import { Download, Users, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllEmployeesQuery } from '../hrm/hrmApi';
import { useGetAllPayrollsQuery } from '../hrm/hrmApi';
import { useGetAllLeavesQuery } from '../hrm/hrmApi';
import { useGetAttendanceQuery } from '../hrm/hrmApi';

const now = new Date();

const HRMReport = () => {
  const { t } = useLanguage();

  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const { data: payrollData } = useGetAllPayrollsQuery({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    limit: 500,
  });
  const { data: leaveData } = useGetAllLeavesQuery({ status: 'pending', limit: 100 });
  const { data: attendanceData } = useGetAttendanceQuery({
    date: now.toISOString().split('T')[0],
    limit: 500,
  });

  const employees = empData?.data?.data || [];
  const payrolls = payrollData?.data || [];
  const pendingLeaves = leaveData?.meta?.totalItems ?? leaveData?.data?.length ?? 0;
  const attendanceToday = attendanceData?.data || [];

  const presentToday = attendanceToday.filter(
    (a: any) => a.status === 'present' || a.status === 'late',
  ).length;
  const attendanceRate =
    attendanceToday.length > 0 ? Math.round((presentToday / attendanceToday.length) * 100) : 0;

  const thisMonthPayroll = payrolls.reduce((s: number, p: any) => s + Number(p.netSalary ?? 0), 0);

  const deptMap = useMemo(() => {
    const map: Record<string, { employees: number; totalSalary: number }> = {};
    employees.forEach((e: any) => {
      const dept = e.department || 'Unassigned';
      if (!map[dept]) map[dept] = { employees: 0, totalSalary: 0 };
      map[dept].employees++;
      map[dept].totalSalary += Number(e.basicSalary ?? 0);
    });
    return map;
  }, [employees]);

  const stats = [
    {
      label: 'Total Employees',
      value: employees.length,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'This Month Payroll',
      value: `৳${thisMonthPayroll.toLocaleString()}`,
      icon: <TrendingUp className="h-5 w-5 text-[#ff6d29]" />,
      bg: 'bg-orange-50 border-orange-200',
    },
    {
      label: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: <Users className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves,
      icon: <Users className="h-5 w-5 text-yellow-600" />,
      bg: 'bg-yellow-50 border-yellow-200',
    },
  ];

  return (
    <div>
      <PageHeader
        title="HRM Report"
        subtitle="Human resource management summary"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'HRM Report' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`border rounded-lg p-4 ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-[#26272F]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Department breakdown */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm mb-5">
        <div className="px-4 py-3 border-b border-[#DBDFE9]">
          <h3 className="text-sm font-semibold text-[#26272F]">Department Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Department', 'Employees', 'Avg Salary'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(deptMap).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-gray-400">
                    No department data
                  </td>
                </tr>
              ) : (
                Object.entries(deptMap).map(([dept, info]) => (
                  <tr key={dept} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{dept}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {info.employees}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ৳
                      {info.employees > 0
                        ? Math.round(info.totalSalary / info.employees).toLocaleString()
                        : 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employment type breakdown */}
      {employees.length > 0 && (
        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-[#DBDFE9]">
            <h3 className="text-sm font-semibold text-[#26272F]">Employment Type</h3>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['full_time', 'part_time', 'contract', 'intern'].map((type) => {
              const count = employees.filter((e: any) => e.employmentType === type).length;
              return (
                <div
                  key={type}
                  className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="text-xl font-bold text-[#26272F]">{count}</div>
                  <div className="text-xs text-gray-500 capitalize mt-0.5">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMReport;
