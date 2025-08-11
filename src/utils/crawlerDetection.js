// Utility functions for detecting social media crawlers and bots

// Common social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit/1.1',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'facebookcatalog/1.0',
  'twitterbot/1.0',
  'linkedinbot/1.0',
  'whatsapp/1.0',
  'telegrambot/1.0',
  'slackbot/1.0',
  'discordbot/1.0',
  'skypebot/1.0',
  'linebot/1.0',
  'viberbot/1.0',
  'wechat/1.0',
  'instagram/1.0',
  'pinterest/1.0',
  'redditbot/1.0',
  'tumblr/1.0',
  'snapchat/1.0',
  'tiktok/1.0',
  'googlebot/1.0',
  'bingbot/1.0',
  'yandexbot/1.0',
  'duckduckbot/1.0',
  'baiduspider/1.0',
  'sogou/1.0',
  'ahrefsbot/1.0',
  'semrushbot/1.0',
  'mj12bot/1.0',
  'dotbot/1.0',
  'rogerbot/1.0',
  'ia_archiver/1.0',
  'archive.org_bot/1.0',
  'wayback/1.0',
  'ia_archiver/1.0',
  'archive.org_bot/1.0',
  'wayback/1.0'
];

/**
 * Check if the current request is from a social media crawler
 * @returns {boolean} True if the request is from a crawler
 */
export function isCrawler() {
  if (typeof window === 'undefined') {
    // Server-side rendering - assume it's a crawler for meta tags
    return true;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  return CRAWLER_USER_AGENTS.some(crawlerAgent => 
    userAgent.includes(crawlerAgent.toLowerCase())
  );
}

/**
 * Check if the current request is from a specific type of crawler
 * @param {string} type - The type of crawler to check for
 * @returns {boolean} True if the request is from the specified crawler type
 */
export function isSpecificCrawler(type) {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  const typeLower = type.toLowerCase();
  
  return CRAWLER_USER_AGENTS.some(crawlerAgent => 
    crawlerAgent.toLowerCase().includes(typeLower) && 
    userAgent.includes(crawlerAgent.toLowerCase())
  );
}

/**
 * Get the type of crawler making the request
 * @returns {string|null} The type of crawler or null if not a crawler
 */
export function getCrawlerType() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  for (const crawlerAgent of CRAWLER_USER_AGENTS) {
    if (userAgent.includes(crawlerAgent.toLowerCase())) {
      if (crawlerAgent.includes('facebook')) return 'facebook';
      if (crawlerAgent.includes('twitter')) return 'twitter';
      if (crawlerAgent.includes('linkedin')) return 'linkedin';
      if (crawlerAgent.includes('whatsapp')) return 'whatsapp';
      if (crawlerAgent.includes('telegram')) return 'telegram';
      if (crawlerAgent.includes('slack')) return 'slack';
      if (crawlerAgent.includes('discord')) return 'discord';
      if (crawlerAgent.includes('skype')) return 'skype';
      if (crawlerAgent.includes('line')) return 'line';
      if (crawlerAgent.includes('viber')) return 'viber';
      if (crawlerAgent.includes('wechat')) return 'wechat';
      if (crawlerAgent.includes('instagram')) return 'instagram';
      if (crawlerAgent.includes('pinterest')) return 'pinterest';
      if (crawlerAgent.includes('reddit')) return 'reddit';
      if (crawlerAgent.includes('tumblr')) return 'tumblr';
      if (crawlerAgent.includes('snapchat')) return 'snapchat';
      if (crawlerAgent.includes('tiktok')) return 'tiktok';
      if (crawlerAgent.includes('google')) return 'google';
      if (crawlerAgent.includes('bing')) return 'bing';
      if (crawlerAgent.includes('yandex')) return 'yandex';
      if (crawlerAgent.includes('duckduck')) return 'duckduck';
      if (crawlerAgent.includes('baidu')) return 'baidu';
      if (crawlerAgent.includes('sogou')) return 'sogou';
      if (crawlerAgent.includes('ahrefs')) return 'ahrefs';
      if (crawlerAgent.includes('semrush')) return 'semrush';
      if (crawlerAgent.includes('mj12')) return 'mj12';
      if (crawlerAgent.includes('dotbot')) return 'dotbot';
      if (crawlerAgent.includes('roger')) return 'roger';
      if (crawlerAgent.includes('ia_archiver')) return 'archive';
      if (crawlerAgent.includes('wayback')) return 'wayback';
    }
  }
  
  return null;
}
