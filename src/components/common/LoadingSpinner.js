import { Box, CircularProgress } from '@mui/material';
import colors from '../../styles/colors';

const LoadingSpinner = ({ size = 40, color = colors.primary.main }) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1000,
      }}
    >
      <CircularProgress 
        size={size}
        sx={{
          color: color,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
    </Box>
  );
};

export default LoadingSpinner; 