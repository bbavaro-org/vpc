import type { SpecialtyBooking, Waitlist } from '../../application/capacity';

/** Booked percentage at or above which a specialty is shown as near full. */
const NEAR_FULL_PERCENT = 90;

const cardStyle = {
  background: 'var(--white)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: 'var(--space-4)',
} as const;

function SpecialtyRow({ booking }: { booking: SpecialtyBooking }) {
  if (booking.state === 'no-capacity') {
    return (
      <li data-specialty={booking.specialty} data-no-capacity="true" data-near-full="false">
        <span className="text-body">{booking.specialty}</span> <span className="vpc-tag">No capacity</span>
      </li>
    );
  }
  const pct = booking.bookedPercent;
  const nearFull = pct >= NEAR_FULL_PERCENT;
  return (
    <li data-specialty={booking.specialty} data-near-full={nearFull} data-no-capacity="false">
      <span className="text-body">{booking.specialty}</span>{' '}
      <span className="text-body" style={{ color: 'var(--ink-2)' }}>{`${pct}% booked`}</span>
      {nearFull ? (
        <>
          {' '}
          <span className="vpc-tag">Near full</span>
        </>
      ) : null}
      <div
        style={{
          background: 'var(--line)',
          borderRadius: 'var(--radius-pill)',
          height: 'var(--space-2)',
          marginTop: 'var(--space-1)',
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            background: nearFull ? 'var(--ink)' : 'var(--lime)',
          }}
        />
      </div>
    </li>
  );
}

export function CapacityPanel({
  bookings,
  waitlist,
}: {
  bookings: readonly SpecialtyBooking[];
  waitlist: Waitlist;
}) {
  return (
    <article style={cardStyle} data-panel="clinician-capacity">
      <div className="vpc-eyebrow">Booked, next two weeks</div>
      <ul
        style={{
          listStyle: 'none',
          margin: 'var(--space-2) 0 0',
          padding: 0,
          display: 'grid',
          gap: 'var(--space-3)',
        }}
      >
        {bookings.map((b) => (
          <SpecialtyRow key={b.specialty} booking={b} />
        ))}
      </ul>
      <div className="vpc-eyebrow" style={{ marginTop: 'var(--space-4)' }}>
        Waitlist
      </div>
      <p className="text-heading-3" style={{ margin: 'var(--space-2) 0 0' }} data-waitlist-total={waitlist.total}>
        {waitlist.total}
      </p>
      <p className="text-body" style={{ color: 'var(--ink-2)', margin: 'var(--space-1) 0 0' }}>
        {waitlist.dominantSpecialty ? `Most waiting: ${waitlist.dominantSpecialty}` : 'No one waiting'}
      </p>
    </article>
  );
}
