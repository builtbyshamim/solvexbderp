import ComingSoon from '../../components/shared/ComingSoon';
import { useLanguage } from '../../context/LanguageContext';

const ProfitLossReport = () => {
  const { t } = useLanguage();
  return (
    <ComingSoon
      title={t('reports.profitLossReport.title')}
      subtitle={t('reports.profitLossReport.subtitle')}
      breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.reports') }, { label: t('reports.profitLossReport.title') }]}
    />
  );
};

export default ProfitLossReport;
