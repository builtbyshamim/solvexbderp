import ComingSoon from '../../components/shared/ComingSoon';

const StockReportPage = () => (
  <ComingSoon
    title="Stock Report"
    subtitle="Detailed stock movement and valuation reports"
    breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Reports' }, { label: 'Stock Report' }]}
  />
);

export default StockReportPage;
