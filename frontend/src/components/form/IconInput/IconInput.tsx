import React from "react";

interface IconInputProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  labelExtra?: React.ReactNode;
}

function IconInput({
  type,
  value,
  onChange,
  placeholder,
  label,
  icon,
  required = false,
  labelExtra,
}: IconInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">
          {label}
        </label>
        {labelExtra}
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors [&>svg]:w-full [&>svg]:h-full">
            {icon}
          </div>
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="
            w-full pl-10 p-2.5 rounded-lg text-sm
            bg-white
            border border-[var(--border-default)]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            focus:outline-none
            focus:ring-2 focus:ring-[var(--color-primary)]/20
            focus:border-[var(--color-primary)]
            transition-all
          "
        />
      </div>
    </div>
  );
}

export default IconInput;
