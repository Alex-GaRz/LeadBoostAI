import React from 'react';

const ContentGallery: React.FC = () => {
  return (
    <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
      <h2 className="text-xl font-bold text-black mb-1">Galería de Contenidos</h2>
      <p className="text-gray-600 mb-4">Aquí podrás ver y gestionar todas tus imágenes y videos generados para tus campañas.</p>
      {/* Aquí puedes agregar la lógica para mostrar la galería de imágenes/videos */}
      <div className="text-gray-500 text-center py-8">
        (Próximamente: galería de imágenes y videos generados)
      </div>
    </div>
  );
};

export default ContentGallery;
