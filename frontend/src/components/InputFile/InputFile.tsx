"use client";

import { FileInput, Label } from "flowbite-react";
import { UploadCloud } from "lucide-react";

type InputFileProps = {
  onFileSelect: (file: File) => void;
};

export function InputFile({ onFileSelect }: InputFileProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isZip =
      file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");

    if (!isZip) {
      alert("Por favor, selecione apenas arquivos .zip");
      e.target.value = "";
      return;
    }

    onFileSelect(file);
  }

  return (
    <div className="w-full">
      <Label
        htmlFor="dropzone-file"
        className="
          flex flex-col items-center justify-center
          w-full h-56 rounded-xl
          border-2 border-dashed
          border-[var(--border-hover)]
          bg-white
          hover:bg-[var(--bg-card-hover)]
          transition-colors duration-200
          cursor-pointer
        "
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="p-3 rounded-full bg-[var(--color-primary-glow)]">
            <UploadCloud className="w-8 h-8 text-[var(--color-primary)]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Arraste seu arquivo <span className="text-[var(--color-primary)]">.zip</span> aqui
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Suporta arquivos compactados contendo múltiplas amostras de áudio
            </p>
          </div>

          <span className="btn-primary text-xs !py-2 !px-4">
            Selecionar Arquivo
          </span>


        </div>

        <FileInput
          id="dropzone-file"
          className="hidden"
          accept=".zip,application/zip"
          onChange={handleChange}
        />
      </Label>
    </div>
  );
}
