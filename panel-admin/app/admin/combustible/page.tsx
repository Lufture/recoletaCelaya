import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from '@/components/admin/DataTableSkeleton';

export default function CombustiblePage() {
  return (
    <>
      <PageHeader
        title="Combustible"
        description="Estimación y registro de consumo de combustible"
        actions={
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Registrar consumo
          </button>
        }
      />
      <DataTableSkeleton columns={6} rows={8} />
    </>
  );
}
