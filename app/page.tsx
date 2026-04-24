"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [format, setFormat] = useState<string>("webp");
  const [quality, setQuality] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
    },
  });

  const handleConvert = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("format", format);

    if (quality !== null) formData.append("quality", String(quality));

    setLoading(true);

    const res = await axios.post("/api/convert", formData, {
      responseType: "blob",
    });

    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = files.length > 1 ? "images.zip" : `image.${format}`;
    link.click();

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl">

        <h1 className="text-2xl font-bold mb-4 text-center">
          Image Converter
        </h1>

        {/* Drag & Drop */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg text-center cursor-pointer mb-4"
        >
          <input {...getInputProps()} />
          <p>Drag & drop images or click to upload</p>
        </div>

        {/* File Count */}
        <p className="text-sm text-gray-500 mb-4">
          {files.length} file(s) selected
        </p>

        {/* Preview */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {files.map((file, i) => {
            const preview = previews[i];
            return (
              <div key={i} className="relative">
                <img src={preview} className="h-20 object-cover rounded w-full" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Format */}
        <select
          className="w-full p-2 border rounded mb-4"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="webp">WEBP</option>
          <option value="jpeg">JPG</option>
          <option value="png">PNG</option>
        </select>

        {/* Quality radios */}
        <div className="mb-4">
          <label className="text-sm">Quality (optional)</label>
          <div className="flex items-center space-x-4 mt-2">
            {[25, 50, 75, 100].map((q) => (
              <label key={q} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={quality === q}
                  onChange={() => setQuality(q)}
                  className="form-radio"
                />
                <span className="text-sm">{q}%</span>
              </label>
            ))}
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="quality"
                value="auto"
                checked={quality === null}
                onChange={() => setQuality(null)}
                className="form-radio"
              />
              <span className="text-sm">Auto</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? "Processing..." : "Convert & Download"}
        </button>
      </div>
    </div>
  );
}