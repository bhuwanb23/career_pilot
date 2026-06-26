export default function Logo({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
      <path
        d="M12 28V12h6.5c2.5 0 4.2 1.5 4.2 3.8 0 1.5-.8 2.7-2 3.2l2.8 9H21l-2.5-8.2H15V28h-3zm3-11.5h3.2c1.4 0 2.2-.7 2.2-1.8s-.8-1.8-2.2-1.8H15v3.6z"
        fill="white"
      />
      <path
        d="M25 28l2-5.5h.1L29.2 28H32l-3.8-10h-2.8L21.6 28h3.4z"
        fill="white"
        opacity="0.8"
      />
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
