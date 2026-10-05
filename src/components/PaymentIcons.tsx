import React from "react";

/**
 * Exact vector circular payment method badges:
 * 1. Visa (Deep navy blue gradient with white italic VISA logo)
 * 2. Mastercard (Black circle with red/orange overlapping discs & mastercard text)
 * 3. MoMo Pay Rwanda (MTN Yellow circle with dark navy MoMo Pay Rwanda branding)
 * 4. Airtel Money (Airtel Red circle with clean white airtel money wordmark)
 */

export function VisaBadge({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Visa"
      role="img"
    >
      <defs>
        <radialGradient id="visa-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2b3b8c" />
          <stop offset="100%" stopColor="#141c4d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#visa-grad)" />
      {/* Clean stylized full VISA wordmark for high legibility */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontStyle="italic"
        fontWeight="900"
        letterSpacing="1.5"
        fill="#FFFFFF"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardBadge({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Mastercard"
      role="img"
    >
      <circle cx="50" cy="50" r="50" fill="#000000" />
      <g transform="translate(0, -3)">
        {/* Left Red circle */}
        <circle cx="40" cy="48" r="19" fill="#EB001B" />
        {/* Right Yellow circle */}
        <circle cx="60" cy="48" r="19" fill="#F79E1B" />
        {/* Overlapping intersection */}
        <path
          d="M50 33.6C54.5 37.3 57.4 42.8 57.4 48C57.4 53.2 54.5 58.7 50 62.4C45.5 58.7 42.6 53.2 42.6 48C42.6 42.8 45.5 37.3 50 33.6Z"
          fill="#FF5F00"
        />
      </g>
      {/* Wordmark */}
      <text
        x="50"
        y="75"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="9.5"
        fontWeight="500"
        letterSpacing="-0.3"
        fill="#FFFFFF"
      >
        mastercard
      </text>
    </svg>
  );
}

/**
 * Exact MoMo Pay (Rwanda) circular badge:
 * Iconic MTN Rwanda yellow circle (#FFCC00) with deep navy (#002B49) MoMo Pay branding.
 */
export function MoMoPayRwandaBadge({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="MoMo Pay (Rwanda)"
      role="img"
    >
      {/* MTN Yellow Background */}
      <circle cx="50" cy="50" r="50" fill="#FFCC00" />
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="#E6B800" strokeWidth="1.5" />

      {/* MoMo text */}
      <g transform="translate(50, 42)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="22"
          fontWeight="900"
          letterSpacing="-0.8"
          fill="#002B49"
        >
          MoMo
        </text>
      </g>

      {/* Navy Pill Badge for "PAY" */}
      <g transform="translate(50, 62)">
        <rect
          x="-24"
          y="-9.5"
          width="48"
          height="19"
          rx="9.5"
          fill="#002B49"
        />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="800"
          letterSpacing="0.8"
          fill="#FFFFFF"
        >
          PAY
        </text>
      </g>

      {/* Rwanda indicator at top edge */}
      <text
        x="50"
        y="21"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="7.5"
        fontWeight="800"
        letterSpacing="1.2"
        fill="#002B49"
        opacity="0.8"
      >
        RWANDA
      </text>
    </svg>
  );
}

/**
 * Exact Airtel Money (Rwanda) circular badge:
 * Iconic Airtel red circle (#E41B13) with clean white Airtel Money branding.
 */
export function AirtelMoneyBadge({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Airtel Money"
      role="img"
    >
      {/* Airtel Red Background */}
      <circle cx="50" cy="50" r="50" fill="#E41B13" />

      {/* Stylized Airtel Monogram Swoosh */}
      <path
        d="M50 20C40 20 32 28 32 37C32 44 37 49 43 51C49 53 53 57 53 62C53 66 49 69 44 69C39 69 35 66 34 62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* "airtel" text */}
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="#FFFFFF"
      >
        airtel
      </text>

      {/* "money" text */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="12.5"
        fontWeight="600"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        money
      </text>
    </svg>
  );
}

/**
 * Single Row Component for Accepted Payment Methods:
 * Visa, Mastercard, MoMo Pay (Rwanda), and Airtel Money.
 * Strictly adheres to ONE single row/line on both mobile and desktop.
 */
export function PaymentMethodsRow({ className = "" }: { className?: string }) {
  const BADGES = [
    { key: "visa", label: "Visa", Component: VisaBadge },
    { key: "mastercard", label: "Mastercard", Component: MastercardBadge },
    { key: "momopay", label: "MoMo Pay (Rwanda)", Component: MoMoPayRwandaBadge },
    { key: "airtel", label: "Airtel Money", Component: AirtelMoneyBadge },
  ];

  return (
    <div
      id="footer-payment-methods-row"
      aria-label="Accepted payment methods"
      className={`flex items-center gap-2 sm:gap-2.5 flex-nowrap overflow-x-auto no-scrollbar py-1 ${className}`}
    >
      {BADGES.map(({ key, label, Component }) => (
        <div
          key={key}
          title={label}
          className="shrink-0 transition-transform hover:scale-105 duration-200 cursor-default"
        >
          <Component className="h-8 w-8 sm:h-8.5 sm:w-8.5 drop-shadow-xs" />
        </div>
      ))}
    </div>
  );
}
