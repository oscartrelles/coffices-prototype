import analyticsService from './analyticsService';

class SharingService {
  async sharePlace(placeId, placeName, placeData) {
    analyticsService.trackShareInitiated(placeId, placeName);
    
    const shareData = {
      title: `${placeName} - Coffices`,
      text: `Check out ${placeName} on Coffices! Great coffee shop for remote work.`,
      url: `${window.location.origin}/coffice/${placeId}`
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        analyticsService.trackShareCompleted(placeId, 'native');
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }

    // Fallback to clipboard
    return this.copyToClipboard(shareData.url, placeId);
  }

  async copyToClipboard(text, placeId) {
    try {
      await navigator.clipboard.writeText(text);
      analyticsService.trackShareCompleted(placeId, 'clipboard');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  shareToSocial(platform, placeId, placeName, url) {
    analyticsService.trackShareMethodSelected(placeId, platform);
    
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`Check out ${placeName} on Coffices!`);
    
    let shareUrl;
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return false;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    analyticsService.trackShareCompleted(placeId, platform);
    return true;
  }
}

const sharingService = new SharingService();
export default sharingService;
