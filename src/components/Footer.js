import { components } from '../styles';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={components.footer.container}>
      <div style={components.footer.content}>
        <div style={components.footer.copyright}>
          © {currentYear} Find a Coffice. All rights reserved.
        </div>
        <div style={components.footer.socialLinks}>
          <a href="https://www.instagram.com/find.a.coffice/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            <InstagramIcon style={components.footer.socialIcon} />
          </a>
          <a href="https://www.facebook.com/coffices" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            <FacebookIcon style={components.footer.socialIcon} />
          </a>
          <a href="https://www.linkedin.com/company/coffices" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            <LinkedInIcon style={components.footer.socialIcon} />
          </a>
          <a href="https://chat.whatsapp.com/IQ1U8RKHjcUK5YiqTXVU6W" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            <WhatsAppIcon style={components.footer.socialIcon} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 