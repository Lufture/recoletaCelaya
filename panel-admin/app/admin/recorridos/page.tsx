import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from '@/components/admin/DataTableSkeleton';

export default function RecorridosPage() {
  return (
    <>
      <PageHeader
        title="Recorridos"
        description="Jornadas activas e históricas de recolección"
        actions={
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Iniciar recorrido
          </button>
        }
      />
      <DataTableSkeleton columns={7} rows={8} />
    </>
  );
}
