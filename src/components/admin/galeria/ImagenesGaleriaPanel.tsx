import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
}

interface ImagenGaleria {
  id: string;
  titulo: string | null;
  categoria_id: string;
  tag: string | null;
  imagen_url: string;
  orden: number;
  categorias_galeria?: { nombre: string } | null;
}

export function ImagenesGaleriaPanel() {
  const [imagenes, setImagenes] = useState<ImagenGaleria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const [catsRes, imgsRes] = await Promise.all([
      supabase.from("categorias_galeria").select("id, nombre").order("orden"),
      supabase.from("galeria").select("*, categorias_galeria(nombre)").order("orden", { ascending: false })
    ]);

    if (catsRes.error) setError(catsRes.error.message);
    else if (imgsRes.error) setError(imgsRes.error.message);
    else {
      setCategorias(catsRes.data as Categoria[]);
      setImagenes(imgsRes.data as ImagenGaleria[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!newFile || !newCatId) {
      alert("Debes seleccionar una imagen y una categoría.");
      return;
    }

    setUploading(true);

    try {
      // 1. Subir al bucket
      const fileExt = newFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `trabajos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("galeria")
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("galeria")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 2. Guardar en base de datos
      const { error: dbError } = await supabase.from("galeria").insert({
        titulo: newTitle || null,
        tag: newTag || null,
        categoria_id: newCatId,
        imagen_url: publicUrl,
        activo: true,
      });

      if (dbError) throw dbError;

      // Éxito
      setIsAdding(false);
      setNewFile(null);
      setPreviewUrl(null);
      setNewTitle("");
      setNewTag("");
      setNewCatId("");
      fetchData();
    } catch (err) {
      alert("Error al subir la imagen: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta imagen de la galería?")) return;
    
    // Extraer el path del archivo desde la URL para eliminarlo del bucket
    const matches = url.match(/\/galeria\/(.*)$/);
    if (matches && matches[1]) {
      const filePath = matches[1];
      await supabase.storage.from("galeria").remove([filePath]);
    }
    
    const { error } = await supabase.from("galeria").delete().eq("id", id);
      
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      fetchData();
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)" }}>
          Imágenes del Portafolio
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "primary"} className="flex items-center gap-2">
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancelar" : "Nueva Imagen"}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-[var(--color-surface-light)] border border-[var(--color-border-light)] rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[var(--color-text-on-light)] font-medium mb-4">Subir nueva imagen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div 
                className="border-2 border-dashed border-[var(--color-border-strong)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-[var(--color-primary)] bg-[rgba(0,0,0,0.02)] h-full min-h-[250px]"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-[300px]" />
                ) : (
                  <>
                    <UploadCloud size={40} className="text-[var(--color-text-on-light-faint)] mb-3" />
                    <p className="text-[var(--color-text-on-light-muted)] font-medium mb-1">Haz clic para seleccionar</p>
                    <p className="text-[var(--color-text-on-light-faint)] text-sm">PNG, JPG o WEBP (Max. 5MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
            
            <div className="space-y-4 flex flex-col justify-center">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-on-light-muted)] mb-1">Categoría *</label>
                <select 
                  className="w-full bg-[var(--color-bg-light-alt)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-on-light)]"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                >
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-on-light-muted)] mb-1">Etiqueta (Tag)</label>
                <input 
                  className="w-full bg-[var(--color-bg-light-alt)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-on-light)]"
                  placeholder="Ej: Balayage, Bob moderno..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-on-light-muted)] mb-1">Título (Opcional)</label>
                <input 
                  className="w-full bg-[var(--color-bg-light-alt)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-on-light)]"
                  placeholder="Título para accesibilidad / SEO"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              
              <Button onClick={handleUpload} disabled={uploading || !newFile || !newCatId} variant="primary" className="w-full mt-2">
                {uploading ? "Subiendo..." : "Subir Imagen"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {imagenes.length === 0 ? (
        <div className="bg-[var(--color-surface-light)] border border-[var(--color-border-light)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-text-on-light-faint)]">No hay imágenes en la galería.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagenes.map((img) => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-surface-light)]">
              <div className="aspect-w-3 aspect-h-4 bg-[var(--color-bg-light-alt)]">
                <img 
                  src={img.imagen_url} 
                  alt={img.titulo || ""} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleDelete(img.id, img.imagen_url)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div>
                  <span className="inline-block px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded mb-1">
                    {img.categorias_galeria?.nombre || "Sin categoría"}
                  </span>
                  {img.tag && <p className="text-white text-sm font-medium">{img.tag}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

