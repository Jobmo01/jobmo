/**
 * Signature mark: a faceted gem cut — nods to Sri Lanka's gem-trading
 * heritage ("Ratna Dweepa", island of gems) while doubling as the same
 * hexagonal facet shape used for match-score indicators across the product.
 * One motif, two meanings — used sparingly, never as generic decoration.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <polygon
        points="16,1 29,8.5 29,23.5 16,31 3,23.5 3,8.5"
        className="fill-primary"
      />
      <polygon points="16,1 29,8.5 16,16 3,8.5" className="fill-accent" opacity="0.9" />
      <polygon points="16,16 29,8.5 29,23.5" className="fill-primary" opacity="0.75" />
      <polygon points="16,16 3,8.5 3,23.5" className="fill-primary" opacity="0.55" />
    </svg>
  );
}
