


import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { ref, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { Download, Trash2 } from 'lucide-react';

interface GalleryImage {
  url: string;
  campaignTitle: string;
}


const ContentGallery: React.FC = () => {
  const { user } = useAuth();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
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
  const images: GalleryImage[] = [];
        // 2. Para cada campaña, listar todos los archivos de ia_data y obtener las URLs de imágenes
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
        for (const doc of campaignsSnap.docs) {
          const campaignId = doc.id;
          // Buscar el nombre de la campaña igual que en RecentCampaigns
          let campaignTitle = doc.data()["Nombre de campaña"] || doc.data()["campaign_name"];
          if (!campaignTitle) {
            try {
              const iaDataCol = collection(db, `clients/${user.uid}/campaigns/${campaignId}/ia_data`);
              const iaSnapshot = await getDocs(iaDataCol);
              if (!iaSnapshot.empty) {
                const iaDocData = iaSnapshot.docs[0].data();
                campaignTitle = iaDocData["Nombre de campaña"] || iaDocData["campaign_name"];
              }
            } catch {}
          }
          // Si sigue sin título, usar 'Sin título'
          if (!campaignTitle) campaignTitle = 'Sin título';
          const iaDataRef = ref(storage, `clients/${user.uid}/campaigns/${campaignId}/ia_data`);
          try {
            const listResult = await listAll(iaDataRef);
            for (const itemRef of listResult.items) {
              const name = itemRef.name.toLowerCase();
              if (imageExtensions.some(ext => name.endsWith(ext))) {
                try {
                  const url = await getDownloadURL(itemRef);
                  images.push({ url, campaignTitle });
                } catch (e) {
                  // Si falla obtener la URL, ignorar
                }
              }
            }
          } catch (e) {
            // Si la carpeta no existe o está vacía, ignorar
          }
        }
        setGalleryImages(images);
      } catch (e) {
  setGalleryImages([]);
      }
      setLoading(false);
    }
    fetchImages();
  }, [user]);

  return (
    <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
      <h2 className="text-2xl font-semibold text-black mb-1">Galería de contenido</h2>
      <p className="text-[#6B7280] text-sm mb-4">Aquí podrás ver y gestionar todas tus imágenes generadas para tus campañas.</p>
      {loading ? (
        <div className="text-gray-500 text-center py-8">Cargando imágenes...</div>
      ) : galleryImages.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No hay imágenes generadas por la IA aún.</div>
      ) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="relative w-full h-80 overflow-hidden group bg-white border border-gray-200 shadow">
              <img
                src={img.url}
                alt=""
                className="object-cover w-full h-full bg-white transition duration-200 group-hover:filter group-hover:grayscale group-hover:brightness-75"
              />
              <div className="absolute top-3 left-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="bg-[#2563eb] hover:bg-blue-700 text-white rounded px-3 py-1 text-sm font-semibold flex items-center gap-1 shadow"
                  style={{ pointerEvents: 'auto' }}
                  title="Descargar imagen"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const response = await fetch(img.url, { mode: 'cors' });
                      if (!response.ok) throw new Error('Network response was not ok');
                      const blob = await response.blob();
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = downloadUrl;
                      a.download = `imagen.png`;
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
                  <Download className="w-4 h-4" /> Descargar
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-sm font-semibold flex items-center gap-1 shadow"
                  style={{ pointerEvents: 'auto' }}
                  title="Eliminar imagen"
                  onClick={(e) => {
                    e.preventDefault();
                    setImageToDelete(img.url);
                    setShowConfirm(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                            setGalleryImages((prev) => prev.filter((img) => img.url !== imageToDelete));
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
  );
};

export default ContentGallery;
