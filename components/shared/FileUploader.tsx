"use client";

import { FileImage, FileText, Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

export type UploadedFileItem = {
  id?: string;
  name: string;
  url?: string;
  type?: string;
};

type FileUploaderProps = {
  label?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  files?: File[];
  existingFiles?: UploadedFileItem[];
  onFilesChange?: (files: File[]) => void;
};

function getFileIcon(name: string, type?: string) {
  if (type?.startsWith("image/")) return <FileImage size={18} />;
  if (name.toLowerCase().endsWith(".pdf")) return <FileText size={18} />;
  return <FileText size={18} />;
}

export default function FileUploader({
  label = "رفع الملفات",
  helperText = "يمكنك رفع ملفات PDF أو الصور.",
  accept,
  multiple = true,
  disabled = false,
  files,
  existingFiles = [],
  onFilesChange,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const currentFiles = files ?? internalFiles;

  function updateFiles(nextFiles: File[]) {
    if (files === undefined) {
      setInternalFiles(nextFiles);
    }
    onFilesChange?.(nextFiles);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    updateFiles(multiple ? nextFiles : nextFiles.slice(0, 1));
  }

  function removeFile(index: number) {
    updateFiles(currentFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="md-label-large" style={{ color: "var(--md-on-surface)" }}>
          {label}
        </p>
        <p className="md-body-small mt-1" style={{ color: "var(--md-on-surface-variant)" }}>
          {helperText}
        </p>
      </div>

      <div
        className="rounded-[var(--md-shape-xl)] border border-dashed p-5 text-center"
        style={{
          background: "var(--md-surface-container-low)",
          borderColor: "var(--md-outline-variant)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="md-btn md-btn-tonal md-state disabled:opacity-50"
        >
          <Upload size={18} />
          اختيار الملفات
        </button>

        <p className="md-body-small mt-3" style={{ color: "var(--md-on-surface-variant)" }}>
          {multiple ? "يمكن اختيار أكثر من ملف." : "يمكن اختيار ملف واحد فقط."}
        </p>
      </div>

      {existingFiles.length > 0 ? (
        <div className="space-y-2">
          <p className="md-label-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            الملفات الحالية
          </p>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((file) => (
              <a
                key={file.id ?? file.name}
                href={file.url}
                target={file.url ? "_blank" : undefined}
                rel={file.url ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md-label-medium"
                style={{
                  background: "var(--md-surface-container)",
                  color: "var(--md-on-surface-variant)",
                }}
              >
                {getFileIcon(file.name, file.type)}
                <span>{file.name}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {currentFiles.length > 0 ? (
        <div className="space-y-2">
          <p className="md-label-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            الملفات المحددة
          </p>
          <div className="space-y-2">
            {currentFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span style={{ color: "var(--md-primary)" }}>{getFileIcon(file.name, file.type)}</span>
                  <div className="min-w-0">
                    <p className="truncate md-body-medium" style={{ color: "var(--md-on-surface)" }}>
                      {file.name}
                    </p>
                    <p className="md-body-small" style={{ color: "var(--md-on-surface-variant)" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => removeFile(index)} className="md-icon-btn" aria-label="إزالة الملف">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
