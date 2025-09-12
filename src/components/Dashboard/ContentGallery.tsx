

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { ref, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { Download, Trash2 } from 'lucide-react';


const ContentGallery: React.FC = () => {
  const { user } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Obtener todas las campañas del usuario
        const campaignsCol = collection(db, `clients/${user.uid}/campaigns`);
        const campaignsSnap = await getDocs(campaignsCol);
        const urls: string[] = [];
        // 2. Para cada campaña, listar todos los archivos de ia_data y obtener las URLs de imágenes
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
        for (const doc of campaignsSnap.docs) {
          const campaignId = doc.id;
          const iaDataRef = ref(storage, `clients/${user.uid}/campaigns/${campaignId}/ia_data`);
          try {
            const listResult = await listAll(iaDataRef);
            for (const itemRef of listResult.items) {
              const name = itemRef.name.toLowerCase();
              if (imageExtensions.some(ext => name.endsWith(ext))) {
                try {
                  const url = await getDownloadURL(itemRef);
                  urls.push(url);
                } catch (e) {
                  // Si falla obtener la URL, ignorar
                }
              }
            }
          } catch (e) {
            // Si la carpeta no existe o está vacía, ignorar
          }
        }
        setImageUrls(urls);
      } catch (e) {
        setImageUrls([]);
      }
      setLoading(false);
    };
    fetchImages();
  }, [user]);

  return (
    <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
      <h2 className="text-xl font-bold text-black mb-1">Galería de Contenidos</h2>
      <p className="text-gray-600 mb-4">Aquí podrás ver y gestionar todas tus imágenes generadas para tus campañas.</p>
      {loading ? (
        <div className="text-gray-500 text-center py-8">Cargando imágenes...</div>
      ) : imageUrls.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No hay imágenes generadas por la IA aún.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden group"
              style={{ minHeight: '12rem' }}
            >
              <img
                src={url}
                alt={`Imagen IA ${idx + 1}`}
                className="object-contain w-full h-48 transition duration-200 group-hover:filter group-hover:grayscale group-hover:brightness-75 bg-transparent"
                style={{ background: 'transparent' }}
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="bg-[#2d4792] hover:bg-blue-700 text-white rounded-full p-1 shadow flex items-center justify-center"
                  style={{ pointerEvents: 'auto', width: 28, height: 28 }}
                  title="Descargar imagen"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const response = await fetch(url, { mode: 'cors' });
                      if (!response.ok) throw new Error('Network response was not ok');
                      const blob = await response.blob();
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = downloadUrl;
                      a.download = `imagen-ia-${idx + 1}.png`;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        window.URL.revokeObjectURL(downloadUrl);
                        a.remove();
                      }, 100);
                    } catch (e) {
                      alert('No se pudo descargar la imagen.');
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow flex items-center justify-center"
                  style={{ pointerEvents: 'auto', width: 28, height: 28 }}
                  title="Eliminar imagen"
                  onClick={(e) => {
                    e.preventDefault();
                    setImageToDelete(url);
                    setShowConfirm(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
  {/* Modal de confirmación para eliminar imagen */}
  {showConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
        <h3 className="text-lg font-bold text-[#2d4792] mb-2">¿Eliminar imagen?</h3>
        <p className="text-gray-700 mb-6 text-center">¿Seguro que deseas eliminar esta imagen? Esta acción no se puede deshacer.</p>
        <div className="flex gap-4 w-full justify-center">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
            onClick={() => { setShowConfirm(false); setImageToDelete(null); }}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            onClick={async () => {
              if (!imageToDelete || !user) return;
              setShowConfirm(false);
              try {
                // Buscar el StorageReference correspondiente a la URL
                const campaignsCol = collection(db, `clients/${user.uid}/campaigns`);
                const campaignsSnap = await getDocs(campaignsCol);
                let deleted = false;
                for (const doc of campaignsSnap.docs) {
                  const campaignId = doc.id;
                  const iaDataRef = ref(storage, `clients/${user.uid}/campaigns/${campaignId}/ia_data`);
                  try {
                    const listResult = await listAll(iaDataRef);
                    for (const itemRef of listResult.items) {
                      const fileUrl = await getDownloadURL(itemRef);
                      if (fileUrl === imageToDelete) {
                        await deleteObject(itemRef);
                        setImageUrls((prev) => prev.filter((u) => u !== imageToDelete));
                        deleted = true;
                        break;
                      }
                    }
                  } catch {}
                  if (deleted) break;
                }
                if (!deleted) throw new Error('No se pudo encontrar la imagen para eliminar.');
              } catch (e) {
                alert('No se pudo eliminar la imagen.');
              } finally {
                setImageToDelete(null);
              }
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentGallery;
