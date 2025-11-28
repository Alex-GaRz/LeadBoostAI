import httpx
import asyncio
import random
import logging
import os
from fake_useragent import UserAgent

class GhostClient:
    """
    Cliente HTTP Asíncrono diseñado para operaciones 'Stealth'.
    Implementa Jitter, Rotación de User-Agents y Rotación de Proxies.
    """
    def __init__(self):
        self.ua = UserAgent()
        self.logger = logging.getLogger("GhostClient")
        
        # Cargar Proxies desde variable de entorno (formato: "http://user:pass@ip:port,http://ip:port")
        raw_proxies = os.getenv("PROXIES_LIST", "")
        self.proxies = [p.strip() for p in raw_proxies.split(",") if p.strip()]
        
        if self.proxies:
            self.logger.info(f"🛡️ GhostClient armado con {len(self.proxies)} proxies de combate.")
        else:
            self.logger.warning(f"⚠️ Sin proxies configurados. Navegando a cara descubierta (IP Real).")

        self.base_headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
        }

    def _get_random_headers(self) -> dict:
        """Genera una huella digital única para cada petición."""
        headers = self.base_headers.copy()
        headers["User-Agent"] = self.ua.random
        return headers

    def _get_random_proxy(self) -> str:
        """Selecciona una IP aleatoria del arsenal."""
        if not self.proxies:
            return None
        return random.choice(self.proxies)

    async def _jitter(self):
        """Introduce un retardo aleatorio humano (0.5s a 3.0s)."""
        delay = random.uniform(0.5, 3.0)
        await asyncio.sleep(delay)

    async def get(self, url: str, retries: int = 3) -> httpx.Response:
        """
        Realiza una petición GET con evasión de detección total.
        """
        await self._jitter()
        
        for attempt in range(retries):
            # Rotación: Nueva Identidad + Nueva IP en cada intento
            current_proxy = self._get_random_proxy()
            current_headers = self._get_random_headers()
            
            # Debug (Solo activar si es necesario)
            # proxy_log = "DIRECT" if not current_proxy else current_proxy.split('@')[-1]
            # print(f"   Ghost Attempt {attempt+1}: {proxy_log} -> {url[:30]}...")

            try:
                # Mounts para proxy (httpx maneja proxies con mount points)
                mounts = {}
                if current_proxy:
                    mounts = {"http://": httpx.AsyncHTTPTransport(proxy=current_proxy),
                              "https://": httpx.AsyncHTTPTransport(proxy=current_proxy)}
                
                # Usamos proxies= directamente si es simple, o mounts para control fino.
                # Para httpx moderno, 'proxy' arg es suficiente para http/https
                async with httpx.AsyncClient(
                    timeout=15.0, 
                    follow_redirects=True, 
                    proxy=current_proxy, # Inyección de Proxy
                    verify=False # A veces necesario para proxies HTTPS residenciales
                ) as client:
                    
                    response = await client.get(url, headers=current_headers)
                    
                    # Manejo de Rate Limiting (429)
                    if response.status_code == 429:
                        wait_time = random.uniform(5, 15)
                        self.logger.warning(f"⛔ Soft Ban (429). Cambiando identidad y esperando {wait_time:.1f}s...")
                        await asyncio.sleep(wait_time)
                        continue 
                    
                    response.raise_for_status()
                    return response

            except (httpx.HTTPError, httpx.ProxyError, Exception) as e:
                self.logger.error(f"⚠️ Fallo de Red/Proxy (Intento {attempt+1}): {str(e)}")
                if attempt == retries - 1:
                    # Si fallan todos los proxies, lanzamos error
                    raise e
                await asyncio.sleep(1) # Breve pausa antes de rotar
        
        return None

    async def download_content(self, url: str) -> bytes:
        """Descarga contenido binario rotando IP si es necesario."""
        current_proxy = self._get_random_proxy()
        try:
            async with httpx.AsyncClient(
                timeout=30.0, 
                follow_redirects=True,
                proxy=current_proxy,
                verify=False
            ) as client:
                response = await client.get(url, headers=self._get_random_headers())
                response.raise_for_status()
                return response.content
        except Exception as e:
            self.logger.error(f"❌ Error descargando multimedia con Proxy {current_proxy}: {e}")
            return None