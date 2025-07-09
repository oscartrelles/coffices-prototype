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
          <InstagramIcon style={components.footer.socialIcon} />
          <FacebookIcon style={components.footer.socialIcon} />
          <LinkedInIcon style={components.footer.socialIcon} />
          <WhatsAppIcon style={components.footer.socialIcon} />
        </div>
      </div>
    </footer>
  );
}

export default Footer; 