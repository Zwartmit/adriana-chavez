import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ImageUploaderProps {
  bucket: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ bucket, value, onChange, maxImages = 4 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      alert(`Solo puedes subir hasta ${maxImages} imágenes en total.`);
      return;
    }

    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${Date.now()}-${safeName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          alert("Error al subir la imagen. Asegúrate de que el bucket exista y sea público.");
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
      }
    } catch (error) {
      console.error("Error inesperado en upload:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (urlToRemove: string) => {
    // Nota: Aquí solo removemos la URL del estado. 
    // Podríamos borrarla físicamente del bucket, pero es más seguro 
    // dejarla o limpiarla mediante un proceso cron en el servidor si no está asociada.
    onChange(value.filter(url => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Zona de subida */}
      {value.length < maxImages && (
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-bg-light)",
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "all var(--transition-fast)",
            opacity: uploading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = "var(--color-primary-dim)";
              e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)";
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.borderColor = "var(--color-border-light)";
              e.currentTarget.style.backgroundColor = "var(--color-bg-light)";
            }
          }}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-[var(--color-primary)] mb-3" size={32} />
          ) : (
            <UploadCloud className="text-[var(--color-text-on-light-faint)] mb-3" size={32} />
          )}
          
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
            {uploading ? "Subiendo imágenes..." : "Haz clic para subir imágenes"}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "0.5rem" }}>
            PNG, JPG, WEBP. Máx {maxImages} fotos.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}

      {/* Grid de miniaturas */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {value.map((url, i) => (
            <div 
              key={i} 
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-bg-light)",
              }}
            >
              <img 
                src={url} 
                alt={`Imagen ${i + 1}`} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  backgroundColor: "rgba(10,10,11,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title="Eliminar imagen"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {/* Espacios vacíos para mantener estructura visual si hay < maxImages */}
          {Array.from({ length: maxImages - value.length }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              style={{
                aspectRatio: "1",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--color-border-light)",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.5,
              }}
            >
              <ImageIcon size={24} color="var(--color-text-on-light-faint)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
