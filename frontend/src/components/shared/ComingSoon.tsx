import { Construction } from 'lucide-react';
import PageHeader from './PageHeader';

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  actions?: React.ReactNode;
}

const ComingSoon = ({ title, subtitle, breadcrumbs, actions }: ComingSoonProps) => {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} actions={actions} />
      <div className="bg-white border border-[#DBDFE9] rounded-xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#fff3eb] flex items-center justify-center mb-5">
          <Construction className="h-8 w-8 text-[#ff6d29]" />
        </div>
        <h3 className="text-lg font-semibold text-[#26272F] mb-2">Under Development</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          This module is currently being built and will be available soon with full functionality.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#fff3eb] text-[#ff6d29] rounded-lg text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6d29] animate-pulse" />
          Coming Soon
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
