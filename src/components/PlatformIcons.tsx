import metaLogo from '../assets/meta-logo.png';
import googleLogo from '../assets/google-logo.png';

export const MetaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={metaLogo}
    alt="Meta Logo"
    className={className}
    style={{ width: 20, height: 20, objectFit: 'contain', display: 'inline', verticalAlign: 'middle' }}
  />
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={googleLogo}
    alt="Google Logo"
    className={className}
    style={{ width: 20, height: 20, objectFit: 'contain', display: 'inline', verticalAlign: 'middle' }}
  />
);
