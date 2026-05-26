import ComingSoon from '../../components/shared/ComingSoon';

const ProfitLossReport = () => (
  <ComingSoon
    title="Profit & Loss Report"
    subtitle="Monthly and yearly P&L analysis"
    breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Reports' }, { label: 'Profit & Loss' }]}
  />
);

export default ProfitLossReport;
