import colors from './colors';

// Typography styles
export const typography = {
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: colors.text.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: colors.text.secondary,
    margin: 0,
  },
  body: {
    fontSize: '14px',
    color: colors.text.primary,
  },
};

// Layout patterns
export const layout = {
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
};

// Icon styles
export const icons = {
  search: {
    color: colors.text.secondary,
    width: '20px',
    height: '20px',
  },
  location: {
    color: colors.primary.main,
    width: '20px',
    height: '20px',
  },
  ratings: {
    wifi: {
      color: colors.primary.main,
      marginRight: '4px',
    },
    power: {
      color: colors.status.warning,
      marginRight: '4px',
    },
    noise: {
      color: colors.status.info,
      marginRight: '4px',
    },
    coffee: {
      color: colors.status.success,
      marginRight: '4px',
    },
  },
  social: {
    color: colors.text.secondary,
    width: '24px',
    height: '24px',
    '&:hover': {
      color: colors.text.primary,
    },
  },
};

// Component styles
export const components = {
  header: {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: colors.background.paper,
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 16px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      '@supports (WebkitTouchCallout: none)': {
        flexWrap: 'nowrap',
        minHeight: '60px'
      }
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    title: {
      ...typography.title,
      '@media (maxWidth: 380px)': {
        fontSize: '20px',
      }
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: colors.status.success,
    },
    userName: {
      fontSize: '14px',
      color: colors.text.secondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px',
    },
    authButton: {
      padding: '8px 16px',
      backgroundColor: colors.primary.main,
      color: colors.background.paper,
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: colors.primary.dark,
      }
    },
    signOutButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'color 0.2s',
      '&:hover': {
        color: colors.text.primary,
      }
    }
  },

  footer: {
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.paper,
      borderTop: `1px solid ${colors.border}`,
      padding: '12px 16px',
      zIndex: 1000,
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    copyright: {
      ...typography.body,
      color: colors.text.secondary,
      fontSize: '12px',
    },
    socialLinks: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
  },

  modal: {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    container: {
      backgroundColor: colors.background.paper,
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '400px',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: colors.text.secondary,
      padding: '4px',
      '&:hover': {
        color: colors.text.primary,
      }
    },
  },

  emailSignIn: {
    container: {
      width: '100%',
    },
    title: {
      textAlign: 'center',
      color: colors.text.primary,
      margin: '0 0 20px 0',
      fontSize: '24px',
      fontWeight: '500',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    input: {
      padding: '10px 12px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      fontSize: '14px',
      transition: 'border-color 0.2s',
      ':focus': {
        borderColor: colors.primary.main,
        outline: 'none',
      }
    },
    primaryButton: {
      padding: '10px 12px',
      backgroundColor: colors.primary.main,
      color: colors.background.paper,
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: colors.primary.dark,
      }
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: colors.primary.main,
      cursor: 'pointer',
      fontSize: '13px',
      padding: '4px',
      ':hover': {
        textDecoration: 'underline',
      }
    },
    error: {
      color: colors.status.error,
      textAlign: 'center',
      marginTop: '12px',
      fontSize: '13px',
    },
    successMessage: {
      color: colors.status.success,
      textAlign: 'center',
      marginBottom: '16px',
      fontSize: '14px',
    }
  },

  placeDetails: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: colors.background.paper,
    },
    header: {
      padding: '16px',
      borderBottom: `1px solid ${colors.border}`,
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: colors.text.secondary,
      padding: '4px',
      '&:hover': {
        color: colors.text.primary,
      }
    },
    title: {
      ...typography.title,
      margin: '0 40px 8px 0',
    },
    address: {
      margin: 0,
      color: colors.text.secondary,
      fontSize: '14px',
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
    },
    ratingSection: {
      marginBottom: '16px',
    },
    ratingRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
    },
    icon: {
      color: colors.primary.main,
      marginRight: '4px',
    },
    ratingLabel: {
      flex: 1,
      color: colors.text.primary,
    },
    ratingValue: {
      color: colors.text.secondary,
      marginLeft: '8px',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: colors.primary.main,
      color: colors.background.paper,
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      marginTop: '16px',
      '&:hover': {
        backgroundColor: colors.primary.dark,
      }
    },
    signInMessage: {
      textAlign: 'center',
      color: colors.text.secondary,
      padding: '16px',
    }
  },

  searchBar: {
    container: {
      position: 'absolute',
      top: '65px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '600px',
      backgroundColor: colors.background.paper,
      borderRadius: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      gap: '8px',
    },
    input: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontSize: '16px',
      color: colors.text.primary,
      backgroundColor: 'transparent',
      '&::placeholder': {
        color: colors.text.secondary,
      }
    },
    locationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: colors.primary.main,
      borderRadius: '50%',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: colors.background.main,
      }
    },
    suggestions: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '8px',
      backgroundColor: colors.background.paper,
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 1000,
    },
    suggestion: {
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: colors.background.main,
      }
    },
    suggestionText: {
      ...typography.body,
      color: colors.text.primary,
    },
    suggestionSecondary: {
      ...typography.body,
      color: colors.text.secondary,
      fontSize: '12px',
      marginTop: '4px',
    }
  },
}; 