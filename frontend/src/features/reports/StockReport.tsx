import ComingSoon from '../../components/shared/ComingSoon';
import { useLanguage } from '../../context/LanguageContext';

const StockReportPage = () => {
  const { t } = useLanguage();
  return (
    <ComingSoon
      title={t('reports.stockReport.title')}
      subtitle={t('reports.stockReport.subtitle')}
      breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.reports') }, { label: t('reports.stockReport.title') }]}
    />
  );
};

export default StockReportPage;
