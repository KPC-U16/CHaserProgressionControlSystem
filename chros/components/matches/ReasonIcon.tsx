import type { Reason } from '@chros/shared';

function reasonShape(reason: Reason) {
  switch (reason) {
    case 'put':
      return (
        <>
          <path d="M12 3.2v7.3" />
          <path d="M8.9 7.4 12 10.5l3.1-3.1" />
          <rect x="4.2" y="13.4" width="15.6" height="6.4" rx="1.6" />
        </>
      );
    case 'surround':
      return (
        <>
          <rect x="9.7" y="3.2" width="4.6" height="4.6" rx="1.2" />
          <rect x="9.7" y="16.2" width="4.6" height="4.6" rx="1.2" />
          <rect x="3.2" y="9.7" width="4.6" height="4.6" rx="1.2" />
          <rect x="16.2" y="9.7" width="4.6" height="4.6" rx="1.2" />
          <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
        </>
      );
    case 'disconnect':
      return (
        <>
          <path d="M3.4 12h5.1" />
          <path d="M8.5 9.4v5.2" />
          <path d="M15.5 12h5.1" />
          <path d="M15.5 9.4v5.2" />
          <path d="M14.4 6.4 9.6 17.6" />
        </>
      );
    case 'illegal-move':
      return (
        <>
          <path d="M3.4 12h9.2" />
          <path d="M9.3 8.4 12.9 12l-3.6 3.6" />
          <path d="M17.4 4.6v14.8" />
        </>
      );
    case 'self-surround':
      return (
        <>
          <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="2.6" />
          <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
        </>
      );
    default:
      return (
        <>
          <rect x="5.8" y="7.4" width="5" height="12.4" rx="1.3" />
          <rect x="13.2" y="12.4" width="5" height="7.4" rx="1.3" />
          <path d="M3.2 20.9h17.6" />
        </>
      );
  }
}

export default function ReasonIcon({ reason }: { reason: Reason }) {
  return (
    <svg
      className="choice-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {reasonShape(reason)}
    </svg>
  );
}
