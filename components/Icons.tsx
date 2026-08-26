type IconProps = {
  size?: number
  strokeWidth?: number
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  }
}

export function SearchIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  )
}

/* Sliders, not sort bars. Three tracks with draggable knobs reads as
   "adjust these values", which is what the filter panel actually does. */
export function FilterIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 7h5M13 7h7" />
      <path d="M4 12h11M19 12h1" />
      <path d="M4 17h3M11 17h9" />
      <circle cx="11" cy="7" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  )
}

export function HomeIcon({ size = 22, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-7v5.5H5A1.5 1.5 0 0 1 3.5 19z" />
    </svg>
  )
}

export function BookmarkIcon({ size = 22, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1v15.4a.6.6 0 0 1-.94.49L12 16.3l-5.56 4.09a.6.6 0 0 1-.94-.49V4.5a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export function BookmarkFilledIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={0} fill="currentColor" stroke="none">
      <path d="M6.5 3h11a1.2 1.2 0 0 1 1.2 1.2v16.1a.75.75 0 0 1-1.19.6L12 16.75l-5.51 4.15a.75.75 0 0 1-1.19-.6V4.2A1.2 1.2 0 0 1 6.5 3z" />
    </svg>
  )
}

export function PlusIcon({ size = 20, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  )
}

export function UserIcon({ size = 22, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6" />
    </svg>
  )
}

export function VerifiedIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={0} fill="currentColor" stroke="none">
      <path d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22.2l-2.4-1.9-3 .3-1-2.9L3 16.1l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3z" />
      <path
        d="M8.3 12.2l2.5 2.5 4.9-4.9"
        stroke="#fff"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 18, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M14.5 5 8 12l6.5 7" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 18, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 18, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M5 9.5 12 16l7-6.5" />
    </svg>
  )
}

export function CheckIcon({ size = 16, strokeWidth = 2.6 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  )
}

export function CloseIcon({ size = 18, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function TrashIcon({ size = 17, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 7h16M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7" />
      <path d="M6.5 7l.9 12.2a1 1 0 0 0 1 .8h7.2a1 1 0 0 0 1-.8L17.5 7" />
    </svg>
  )
}

export function ExternalIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  )
}

export function TelegramIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={0} fill="currentColor" stroke="none">
      <path d="M21.6 4.3 2.9 11.5c-.9.35-.88 1.63.03 1.95l4.3 1.5 1.62 5.1c.25.78 1.25.95 1.74.3l2.3-3.05 4.3 3.17c.62.46 1.5.12 1.66-.63l3.1-14.2c.18-.83-.63-1.53-1.35-1.24zM8.9 14.2l8.55-5.3-6.9 6.35-.2 3.02z" />
    </svg>
  )
}
