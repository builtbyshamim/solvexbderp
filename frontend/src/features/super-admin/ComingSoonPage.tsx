import { Construction } from 'lucide-react';

const ComingSoonPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center">
      <Construction className="h-8 w-8 text-[#ff6d29]" />
    </div>
    <h2 className="text-xl font-bold text-[#26272F]">{title}</h2>
    <p className="text-sm text-gray-400">This section is under construction.</p>
  </div>
);

export default ComingSoonPage;
