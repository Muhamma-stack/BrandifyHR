import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 60, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle for better visibility */}
      <circle cx="50" cy="50" r="48" fill="#000000" />
      
      {/* Central white diamond */}
      <path
        d="M50 20 L70 50 L50 80 L30 50 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      
      {/* Left pink diamond */}
      <path
        d="M25 35 L45 50 L25 65 L5 50 Z"
        fill="none"
        stroke="#e91e63"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      
      {/* Right pink diamond */}
      <path
        d="M75 35 L95 50 L75 65 L55 50 Z"
        fill="none"
        stroke="#e91e63"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
