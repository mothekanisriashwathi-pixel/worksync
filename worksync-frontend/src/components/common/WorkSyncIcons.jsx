/**
 * WorkSync Icon Set
 * Consistent outline SVG icons — 2px stroke, rounded caps/joins.
 * Usage: <IconDashboard size={20} className="..." />
 * All icons accept: size (default 20), className, style, aria-hidden
 */

const iconProps = (size, className, rest) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className,
  'aria-hidden': true,
  ...rest,
})

export function IconDashboard({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconProjects({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M2 7a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

export function IconTasks({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

export function IconTeam({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconSettings({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconNotifications({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function IconProfile({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconSearch({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function IconAdd({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconEdit({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconDelete({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export function IconFilter({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function IconSort({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M3 6h18M7 12h10M11 18h4" />
    </svg>
  )
}

export function IconMoreOptions({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

export function IconComments({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconCalendar({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconAttachments({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

export function IconStatus({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function IconProgress({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

export function IconBack({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

export function IconForward({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function IconChevronLeft({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function IconChevronDown({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconClose({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function IconMenu({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  )
}

export function IconCheck({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function IconLogout({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <path d="M21 12H9" />
    </svg>
  )
}

export function IconHelp({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function IconAppearance({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

export function IconTextSize({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <text x="2" y="18" fontSize="14" fontWeight="bold" stroke="none" fill="currentColor">A</text>
      <text x="13" y="14" fontSize="9" fontWeight="bold" stroke="none" fill="currentColor">A</text>
    </svg>
  )
}

export function IconWarning({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

export function IconInfo({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export function IconSuccess({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  )
}

export function IconError({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )
}

export function IconInbox({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function IconPin({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconGitHub({ size = 20, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export function IconGitBranch({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}

export function IconGitCommit({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22.95" y2="12" />
    </svg>
  )
}

export function IconGitFork({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
      <path d="M12 12v3" />
    </svg>
  )
}

export function IconStar({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function IconExternalLink({ size = 20, className, ...rest }) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
