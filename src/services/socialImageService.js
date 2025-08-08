class SocialImageService {
  getImageForContent(contentType, place = null) {
    switch (contentType) {
      case 'place':
        return place?.mainImageUrl || '/Coffices.PNG';
      case 'profile':
        return '/Coffices.PNG';
      case 'default':
      default:
        return '/Coffices.PNG';
    }
  }

  getFullImageUrl(imagePath) {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${window.location.origin}${imagePath}`;
  }
}

const socialImageService = new SocialImageService();
export default socialImageService;
