'use client';

import {TextInput as FBTextInput, Label, HelperText} from 'flowbite-react';
import React from 'react';

interface TextInputProps {
  name: string;
  value: number;
  label: string;
  placeholder?: string;
  required?: boolean;
  onChange: (s: number) => void;
  error?:string
}

function NumberInput({name, value, label, placeholder, onChange, required, error}: TextInputProps) {
  return (
    <div className="mb-2 block">
      <Label htmlFor={name} color ={error ? 'failure' : 'default'}> {label}</Label>
      <FBTextInput
        id={name}
        type="text"
        onChange={(e) => {
    const val = e.target.value;
    onChange(val === '' ? 0 : parseFloat(val));
  }}
        value={Number.isNaN(value) ? '' : value}
        placeholder={placeholder ?? ''}
        required={required ?? false}
        shadow
        color = {error? 'failure' : 'gray'}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
      {error && <HelperText color='failure'>{error}</HelperText>}
    </div>
  );
}

export default NumberInput;