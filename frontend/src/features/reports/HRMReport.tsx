import { Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const summaryData = [
  { label: 'Total Employees', value: '24', sub: '20 active, 4 on leave' },
  { label: 'This Month Payroll', value: '৳3,24,500', sub: 'Net salary disbursed' },
  { label: 'Attendance Rate', value: '94.2%', sub: 'May 2025 average' },
  { label: 'Pending Leaves', value: '7', sub: 'Awaiting approval' },
];

const deptData = [
  { dept: 'Sales', employees: 8, avg_salary: 18000, attendance: 96 },
  { dept: 'Operations', employees: 6, avg_salary: 22000, attendance: 92 },
  { dept: 'Accounts', employees: 4, avg_salary: 25000, attendance: 98 },
  { dept: 'IT', employees: 3, avg_salary: 35000, attendance: 95 },
  { dept: 'Admin', employees: 3, avg_salary: 20000, attendance: 90 },
];

const HRMReport = () => (
  <div>
    <PageHeader
      title="HRM Report"
      subtitle="HR analytics — payroll, attendance, and workforce summary"
      breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Reports' }, { label: 'HRM Report' }]}
      actions={
        <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
          <Download className="h-4 w-4" /> Export
        </button>
      }
    />

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
      {summaryData.map((s) => (
        <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{s.label}</p>
          <p className="text-xl font-bold mt-1 text-[#26272F]">{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>

    <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-[#DBDFE9]">
        <h3 className="text-sm font-semibold text-[#26272F]">Department Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[#DBDFE9]">
              {['Department', 'Employees', 'Avg Salary', 'Attendance %'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deptData.map((row) => (
              <tr key={row.dept} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#26272F]">{row.dept}</td>
                <td className="px-4 py-3 text-gray-600">{row.employees}</td>
                <td className="px-4 py-3 font-semibold">৳{row.avg_salary.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                      <div
                        className={`h-1.5 rounded-full ${row.attendance >= 95 ? 'bg-green-500' : row.attendance >= 90 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${row.attendance}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{row.attendance}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default HRMReport;
