'use client';

import {TextInput as FBTextInput, Label, HelperText} from 'flowbite-react';
import React, { useEffect, useRef } from 'react';

interface TextInputProps {
  name: string;
  value: string;
  label: string;
  placeholder?: string;
  error?: string;
  onChange: (s: string) => void;
  focus?:boolean;
  type?: string;
}

function TextInput({name, value, label, placeholder, onChange, error,focus,type}: TextInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if(focus) ref.current?.focus()
  },[focus])
  return (
    <div>
      <div className="mb-2 block">
        <Label htmlFor={name} color={error ? 'failure' : 'default'}> {label}</Label>
        <FBTextInput
          ref={ref}
          id={name}
          onChange={(e) => onChange(e.target.value)}
          value={value}
          type={type ?? 'text'}
          placeholder={placeholder ?? ''}
          color={error ? 'failure' : 'gray'}
          shadow
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        {error && <HelperText color='failure'>{error}</HelperText>}
      </div>
    </div>
  );
}

export default TextInput;