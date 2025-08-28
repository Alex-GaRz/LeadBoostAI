import { db } from '../../firebase/firebaseConfig';
import { doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';

// Datos de ejemplo del archivo JSON
const campaignIAData = {
  "Nombre de campaña": "Conoce los Zapatos de Cuero Hechos a Mano en México",
  "Anuncio generado por IA": {
    "Variante 1": {
      "Título del anuncio": "¡Zapatos para tu estilo único!",
      "Texto principal": "Eleva tu estilo con zapatos de cuero hechos a mano en México. Calidad y diseño que destacan en cada paso. ¡Encuéntralos ahora!",
      "CTA": "Pedir más información",
      "Ideas de imágenes/videos": "Video corto de personas jóvenes usando los zapatos en entornos urbanos y de moda.",
      "Formatos sugeridos": ["Reels", "Historias"],
      "Audiencias personalizadas/lookalikes": [
        "Audiencia similar a seguidores de marcas de calzado de lujo.",
        "Audiencia de personas interesadas en moda sostenible."
      ],
      "Vista Previa": "¡Zapatos para tu estilo único! | Eleva tu estilo con zapatos de cuero hechos a mano en México. Calidad y diseño que destacan en cada paso. ¡Encuéntralos ahora! [Pedir más información]"
    },
    "Variante 2": {
      "Título del anuncio": "Moda que empodera: Zapatos 100% mexicanos",
      "Texto principal": "Calzado de cuero artesanal que apoya a la industria local. Cada par cuenta una historia de tradición y calidad. ¡Descubre la diferencia!",
      "CTA": "Pedir más información",
      "Ideas de imágenes/videos": "Imágenes estáticas de alta calidad de los zapatos en diferentes ángulos, con un fondo minimalista.",
      "Formatos sugeridos": ["Feed", "Anuncio de carrusel"],
      "Audiencias personalizadas/lookalikes": [
        "Audiencia de personas que siguen a diseñadores mexicanos.",
        "Audiencia de personas que compran productos hechos en México."
      ],
      "Vista Previa": "Moda que empodera: Zapatos 100% mexicanos | Calzado de cuero artesanal que apoya a la industria local. Cada par cuenta una historia de tradición y calidad. ¡Descubre la diferencia! [Pedir más información]"
    },
    "Variante 3": {
      "Título del anuncio": "El toque perfecto para tu outfit",
      "Texto principal": "Añade un toque de autenticidad a tu look con nuestros zapatos de cuero hechos a mano. La calidad es nuestro sello, y tu estilo es nuestra inspiración.",
      "CTA": "Pedir más información",
      "Ideas de imágenes/videos": "Video de un estilista combinando diferentes outfits con los zapatos.",
      "Formatos sugeridos": ["Reels", "Anuncio de video"],
      "Audiencias personalizadas/lookalikes": [
        "Audiencia de personas interesadas en tendencias de moda y belleza.",
        "Audiencia similar a visitantes de tu sitio web."
      ],
      "Vista Previa": "El toque perfecto para tu outfit | Añade un toque de autenticidad a tu look con nuestros zapatos de cuero hechos a mano. La calidad es nuestro sello, y tu estilo es nuestra inspiración. [Pedir más información]"
    }
  },
  "Resultados esperados": {
    "Alcance": "2500000 - 3500000 personas",
    "Audiencia": "10 - 12 años",
    "CPC": "1.50 - 2.50 MXN",
    "CTR": "1.5% - 2.5%",
    "Engagement rate": "1.8% - 2.8%",
    "Conversiones": "200 - 300",
    "ROAS": "3.5x - 5.0x"
  }
};


/**
 * Sube los datos IA como subcolección 'ia_data' dentro de una campaña específica.
 * @param userId string - ID del usuario
 * @param campaignId string - ID del documento de campaña principal
 */

export async function subirCampaniaIA(userId: string, campaignId: string) {
  // Referencia al documento de campaña principal
  const campaignDocRef = doc(db, `clients/${userId}/campaigns/${campaignId}`);
  // Verifica si existe el documento de campaña
  const campaignSnap = await getDoc(campaignDocRef);
  if (!campaignSnap.exists()) {
    // Si no existe, crea un documento vacío o con datos mínimos
    await setDoc(campaignDocRef, { createdAt: new Date() });
  }
  // Ahora sí, agrega la subcolección
  const iaColRef = collection(campaignDocRef, 'ia_data');
  await addDoc(iaColRef, campaignIAData);
}

// Uso de ejemplo (llamar desde un botón o useEffect):
// import { useAuth } from '../../hooks/useAuth';
// const { user } = useAuth();
// if (user) subirCampaniaIA(user.uid);
