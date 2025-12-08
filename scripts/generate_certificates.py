#!/usr/bin/env python3
"""
Certificate Generation Script
RFC-PHOENIX-03: Fase 3 - Generación de Certificados mTLS

Genera certificados X.509 para cada microservicio:
- CA (Certificate Authority) raíz
- Certificados de servidor para cada servicio
- Certificados de cliente para cada servicio

Uso:
    python scripts/generate_certificates.py
    python scripts/generate_certificates.py --service actuator
    python scripts/generate_certificates.py --clean
"""

import os
import sys
import argparse
import yaml
from pathlib import Path
from datetime import datetime, timedelta

# Agregar directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend


class CertificateGenerator:
    """Generador de certificados X.509 para mTLS"""
    
    def __init__(self, base_dir: Path, config_path: Path):
        self.base_dir = base_dir
        self.certs_dir = base_dir / "certs"
        self.config_path = config_path
        
        # Cargar configuración
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        self.ca_config = self.config.get("ca", {})
        self.services = self.config.get("services", [])
        
        print(f"📁 Directorio base: {self.base_dir}")
        print(f"🔑 Directorio de certificados: {self.certs_dir}")
    
    def generate_ca(self):
        """Genera la Certificate Authority (CA) raíz"""
        
        ca_dir = self.certs_dir / "ca"
        ca_dir.mkdir(parents=True, exist_ok=True)
        
        print("\n🏛️  Generando Certificate Authority (CA)...")
        
        # Generar clave privada para CA
        ca_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=self.ca_config.get("key_size", 2048),
            backend=default_backend()
        )
        
        # Información del CA
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, self.ca_config.get("country", "ES")),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, self.ca_config.get("state", "Madrid")),
            x509.NameAttribute(NameOID.LOCALITY_NAME, self.ca_config.get("locality", "Madrid")),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, self.ca_config.get("organization", "LeadBoostAI")),
            x509.NameAttribute(NameOID.COMMON_NAME, "LeadBoostAI Root CA"),
        ])
        
        # Crear certificado auto-firmado
        ca_cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            ca_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=self.ca_config.get("validity_days", 365) * 2)
        ).add_extension(
            x509.BasicConstraints(ca=True, path_length=0),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_cert_sign=True,
                crl_sign=True,
                key_encipherment=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).sign(ca_key, hashes.SHA256(), default_backend())
        
        # Guardar clave privada CA
        ca_key_path = ca_dir / "ca.key"
        with open(ca_key_path, "wb") as f:
            f.write(ca_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Guardar certificado CA
        ca_cert_path = ca_dir / "ca.crt"
        with open(ca_cert_path, "wb") as f:
            f.write(ca_cert.public_bytes(serialization.Encoding.PEM))
        
        print(f"✅ CA generado:")
        print(f"   - Clave privada: {ca_key_path}")
        print(f"   - Certificado: {ca_cert_path}")
        
        return ca_key, ca_cert
    
    def generate_service_certificates(self, service: dict, ca_key, ca_cert):
        """Genera certificados de servidor y cliente para un servicio"""
        
        service_id = service["service_id"].replace("svc.", "")
        cn = service["certificate_cn"]
        
        print(f"\n🔐 Generando certificados para '{service_id}'...")
        
        service_dir = self.certs_dir / service_id
        service_dir.mkdir(parents=True, exist_ok=True)
        
        # Copiar CA certificate al directorio del servicio
        ca_cert_path = self.certs_dir / "ca" / "ca.crt"
        service_ca_path = service_dir / "ca.crt"
        with open(ca_cert_path, "rb") as src, open(service_ca_path, "wb") as dst:
            dst.write(src.read())
        
        # --- CERTIFICADO DE SERVIDOR ---
        server_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, self.ca_config.get("country", "ES")),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, self.ca_config.get("state", "Madrid")),
            x509.NameAttribute(NameOID.LOCALITY_NAME, self.ca_config.get("locality", "Madrid")),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, self.ca_config.get("organization", "LeadBoostAI")),
            x509.NameAttribute(NameOID.COMMON_NAME, cn),
        ])
        
        server_cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            ca_cert.subject
        ).public_key(
            server_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(cn),
                x509.DNSName(f"{service_id}"),
                x509.DNSName("localhost"),
            ]),
            critical=False,
        ).add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.SERVER_AUTH,
            ]),
            critical=False,
        ).sign(ca_key, hashes.SHA256(), default_backend())
        
        # Guardar certificado de servidor
        server_key_path = service_dir / "server.key"
        server_cert_path = service_dir / "server.crt"
        
        with open(server_key_path, "wb") as f:
            f.write(server_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        with open(server_cert_path, "wb") as f:
            f.write(server_cert.public_bytes(serialization.Encoding.PEM))
        
        # --- CERTIFICADO DE CLIENTE ---
        client_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        client_subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, self.ca_config.get("country", "ES")),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, self.ca_config.get("state", "Madrid")),
            x509.NameAttribute(NameOID.LOCALITY_NAME, self.ca_config.get("locality", "Madrid")),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, self.ca_config.get("organization", "LeadBoostAI")),
            x509.NameAttribute(NameOID.COMMON_NAME, f"{cn}.client"),
        ])
        
        client_cert = x509.CertificateBuilder().subject_name(
            client_subject
        ).issuer_name(
            ca_cert.subject
        ).public_key(
            client_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)
        ).add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.CLIENT_AUTH,
            ]),
            critical=False,
        ).sign(ca_key, hashes.SHA256(), default_backend())
        
        # Guardar certificado de cliente
        client_key_path = service_dir / "client.key"
        client_cert_path = service_dir / "client.crt"
        
        with open(client_key_path, "wb") as f:
            f.write(client_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        with open(client_cert_path, "wb") as f:
            f.write(client_cert.public_bytes(serialization.Encoding.PEM))
        
        print(f"✅ Certificados generados para '{service_id}':")
        print(f"   - CA: {service_ca_path}")
        print(f"   - Server: {server_cert_path}, {server_key_path}")
        print(f"   - Client: {client_cert_path}, {client_key_path}")
    
    def generate_all(self):
        """Genera todos los certificados"""
        
        print("\n" + "="*60)
        print("🔐 GENERADOR DE CERTIFICADOS mTLS - LeadBoostAI")
        print("="*60)
        
        # 1. Generar CA
        ca_key, ca_cert = self.generate_ca()
        
        # 2. Generar certificados para cada servicio
        for service in self.services:
            if service.get("mtls_required", False):
                self.generate_service_certificates(service, ca_key, ca_cert)
        
        # 3. Generar directorio STS para claves de firma
        sts_dir = self.certs_dir / "sts"
        sts_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n📁 Directorio STS creado: {sts_dir}")
        
        print("\n" + "="*60)
        print("✅ GENERACIÓN COMPLETA")
        print("="*60)
        print(f"\n📁 Certificados guardados en: {self.certs_dir}")
        print("\n⚠️  IMPORTANTE:")
        print("   - Los certificados son para DESARROLLO únicamente")
        print("   - NO usar en producción")
        print("   - Validez: 365 días")
        print("   - Renovar antes del vencimiento")
    
    def clean(self):
        """Limpia todos los certificados generados"""
        
        import shutil
        
        if self.certs_dir.exists():
            print(f"🗑️  Eliminando certificados en: {self.certs_dir}")
            shutil.rmtree(self.certs_dir)
            print("✅ Certificados eliminados")
        else:
            print("⚠️  No hay certificados para eliminar")


def main():
    parser = argparse.ArgumentParser(
        description="Generador de certificados X.509 para mTLS"
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Eliminar todos los certificados existentes"
    )
    parser.add_argument(
        "--service",
        type=str,
        help="Generar solo para un servicio específico"
    )
    
    args = parser.parse_args()
    
    # Paths
    base_dir = Path(__file__).parent.parent
    config_path = base_dir / "config" / "security" / "service_identities.yaml"
    
    if not config_path.exists():
        print(f"❌ Error: No se encuentra el archivo de configuración:")
        print(f"   {config_path}")
        sys.exit(1)
    
    generator = CertificateGenerator(base_dir, config_path)
    
    if args.clean:
        generator.clean()
    else:
        generator.generate_all()


if __name__ == "__main__":
    main()
