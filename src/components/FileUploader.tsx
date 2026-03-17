"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface FileUploaderProps {
  onFileUploaded: (fileData: {
    url: string;
    type: string;
    size: number;
    name: string;
  }) => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validaciones
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo no puede ser mayor a 10MB");
        return;
      }

      const allowedTypes = ['image/', 'application/pdf', 'text/plain'];
      const isValid = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValid) {
        alert("Solo se permiten imágenes, PDFs o archivos de texto");
        return;
      }

      setUploading(true);
      setFileName(file.name);

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `works/${fileName}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('works')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('works')
        .getPublicUrl(filePath);

      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      // Enviar datos al componente padre
      onFileUploaded({
        url: publicUrl,
        type: file.type,
        size: file.size,
        name: file.name
      });

    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ 
      border: "2px dashed #ccc", 
      borderRadius: "10px", 
      padding: "20px",
      textAlign: "center",
      background: preview ? "#f8f8f8" : "white",
      marginBottom: "15px"
    }}>
      <input
        type="file"
        id="file-upload"
        accept="image/*,application/pdf,text/plain"
        onChange={uploadFile}
        disabled={uploading}
        style={{ display: "none" }}
      />
      
      {preview ? (
        <div>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ maxWidth: "100%", maxHeight: "200px", marginBottom: "10px", borderRadius: "5px" }}
          />
          <p style={{ fontSize: "0.9rem", marginBottom: "10px" }}>{fileName}</p>
          <button 
            onClick={() => {
              setPreview(null);
              setFileName(null);
              onFileUploaded({ url: '', type: '', size: 0, name: '' });
            }}
            style={{
              padding: "5px 15px",
              background: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Quitar archivo
          </button>
        </div>
      ) : (
        <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block" }}>
          <div style={{ padding: "20px" }}>
            {uploading ? (
              <p>⏫ Subiendo archivo...</p>
            ) : (
              <>
                <p style={{ fontSize: "3rem", margin: "0" }}>📎</p>
                <p style={{ fontWeight: "bold", margin: "10px 0" }}>
                  Haz clic para subir un archivo
                </p>
                <p style={{ fontSize: "0.8rem", color: "#666" }}>
                  Imágenes, PDF o TXT (máx 10MB)
                </p>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}