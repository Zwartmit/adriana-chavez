import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import { ReactCompareSlider } from "react-compare-slider";

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
  
  const [newFileAfter, setNewFileAfter] = useState<File | null>(null);
  const [previewUrlAfter, setPreviewUrlAfter] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAfterRef = useRef<HTMLInputElement>(null);

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

  const handleFileAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewFileAfter(file);
      setPreviewUrlAfter(URL.createObjectURL(file));
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

      // 1.5 Subir al bucket la imagen después (si existe)
      let publicUrlAfter = null;
      if (newFileAfter) {
        const fileExtAfter = newFileAfter.name.split('.').pop();
        const fileNameAfter = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}_after.${fileExtAfter}`;
        const filePathAfter = `trabajos/${fileNameAfter}`;

        const { error: uploadErrorAfter } = await supabase.storage
          .from("galeria")
          .upload(filePathAfter, newFileAfter);

        if (uploadErrorAfter) throw uploadErrorAfter;

        const { data: publicUrlDataAfter } = supabase.storage
          .from("galeria")
          .getPublicUrl(filePathAfter);

        publicUrlAfter = publicUrlDataAfter.publicUrl;
      }

      // 2. Guardar en base de datos
      const catName = categorias.find(c => c.id === newCatId)?.nombre || "";
      const { error: dbError } = await supabase.from("galeria").insert({
        titulo: newTitle || null,
        tag: newTag || null,
        categoria_id: newCatId,
        categoria: catName,
        imagen_url: publicUrl,
        imagen_despues_url: publicUrlAfter,
        activo: true,
      });

      if (dbError) throw dbError;

      // Éxito
      setIsAdding(false);
      setNewFile(null);
      setNewFileAfter(null);
      setPreviewUrl(null);
      setPreviewUrlAfter(null);
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
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "primary"} className="flex items-center gap-2">
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancelar" : "Nueva imagen"}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-[var(--color-surface-light)] border border-[var(--color-border-light)] rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[var(--color-text-on-light)] font-medium mb-4">Subir nueva imagen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div 
                className="border-2 border-dashed border-[var(--color-border-strong)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-[var(--color-primary)] bg-[rgba(0,0,0,0.02)] flex-1 min-h-[160px]"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview Antes" className="w-full h-full object-contain max-h-[160px]" />
                ) : (
                  <>
                    <UploadCloud size={32} className="text-[var(--color-text-on-light-faint)] mb-2" />
                    <p className="text-[var(--color-text-on-light-muted)] font-medium text-sm mb-1">Imagen Principal (o Antes)</p>
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

              <div 
                className="border-2 border-dashed border-[var(--color-border-strong)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-[var(--color-primary)] bg-[rgba(0,0,0,0.02)] flex-1 min-h-[160px]"
                onClick={() => fileInputAfterRef.current?.click()}
              >
                {previewUrlAfter ? (
                  <img src={previewUrlAfter} alt="Preview Después" className="w-full h-full object-contain max-h-[160px]" />
                ) : (
                  <>
                    <UploadCloud size={32} className="text-[var(--color-text-on-light-faint)] mb-2" />
                    <p className="text-[var(--color-text-on-light-muted)] font-medium text-sm mb-1">Imagen Secundaria (o Después)</p>
                    <p className="text-[var(--color-text-on-light-faint)] text-xs">Opcional</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputAfterRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFileAfterChange} 
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
                {uploading ? "Subiendo..." : "Subir imagen"}
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
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-x-3 sm:gap-x-4 space-y-3 sm:space-y-4">
          {imagenes.map((img) => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-surface-light)] break-inside-avoid">
              <div className="w-full bg-[var(--color-bg-light-alt)] relative">
                {img.imagen_despues_url ? (
                  <ReactCompareSlider
                    itemOne={<img src={img.imagen_url} alt="Antes" className="w-full h-full object-cover" />}
                    itemTwo={<img src={img.imagen_despues_url} alt="Después" className="w-full h-full object-cover" />}
                    className="w-full aspect-[3/4]"
                  />
                ) : (
                  <img 
                    src={img.imagen_url} 
                    alt={img.titulo || ""} 
                    className="w-full h-auto object-cover block"
                  />
                )}
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

