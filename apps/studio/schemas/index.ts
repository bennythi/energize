import { localizedString } from './objects/localizedString';
import { localizedText } from './objects/localizedText';
import { localizedPortableText } from './objects/localizedPortableText';

import { siteSettings } from './documents/siteSettings';
import { stage } from './documents/stage';
import { artist } from './documents/artist';
import { faqEntry } from './documents/faqEntry';
import { poi } from './documents/poi';
import { sponsor } from './documents/sponsor';
import { mediaItem } from './documents/mediaItem';
import { page } from './documents/page';

export const schemaTypes = [
  // Reusable Object-Types
  localizedString,
  localizedText,
  localizedPortableText,

  // Document-Types
  siteSettings,
  stage,
  artist,
  faqEntry,
  poi,
  sponsor,
  mediaItem,
  page,
];
