import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import colors from '../styles/colors';

function Footer() {
  return (
    <Box sx={styles.footer}>
      <Typography variant="caption" sx={styles.copyright}>
        © {new Date().getFullYear()} Coffices. All rights reserved.
      </Typography>
      
      <Box sx={styles.socialIcons}>
        <IconButton 
          href="https://instagram.com/find.a.coffice" 
          target="_blank"
          sx={styles.iconButton}
        >
          <InstagramIcon />
        </IconButton>
        <IconButton 
          href="https://facebook.com/coffices" 
          target="_blank"
          sx={styles.iconButton}
        >
          <FacebookIcon />
        </IconButton>
        <IconButton 
          href="https://linkedin.com/company/coffices" 
          target="_blank"
          sx={styles.iconButton}
        >
          <LinkedInIcon />
        </IconButton>
        <IconButton 
          href="https://chat.whatsapp.com/JEBLngi8PYE570RzMLofEG" 
          target="_blank"
          sx={styles.iconButton}
        >
          <WhatsAppIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

const styles = {
  footer: {
    backgroundColor: colors.primary.dark,
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '40px',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1001  // Higher than the map panel
  },
  copyright: {
    color: colors.text.white,
    fontSize: '0.75rem'
  },
  socialIcons: {
    display: 'flex',
    gap: '8px'
  },
  iconButton: {
    padding: '4px',
    color: colors.text.white,
    '&:hover': {
      color: colors.primary.light
    }
  }
};

export default Footer; 