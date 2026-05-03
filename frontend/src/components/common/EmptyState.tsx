interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-12 text-center">
      <div className="mx-auto mb-4 h-2 w-12 rounded-full bg-gradient-to-r from-cyan-400/20 via-cyan-400/80 to-teal-400/20" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/48">{description}</p>
    </div>
  );
}
