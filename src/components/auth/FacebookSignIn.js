import { auth } from '../../firebase-config';
import { FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

const FacebookSignIn = () => {
  const handleFacebookSignIn = async () => {
    const provider = new FacebookAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Facebook sign-in error:', error);
    }
  };

  return (
    <button onClick={handleFacebookSignIn} className="facebook-sign-in">
      Sign in with Facebook
    </button>
  );
};

export default FacebookSignIn; 