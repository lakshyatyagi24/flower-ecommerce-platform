/**
 * Occasion landing pages (/occasions/<slug>). `tag` is the Product.tags value the page filters on and always
 * equals `slug`; admins tag products with these values.
 *
 * Copy is DRAFT editorial text for the owner to review. Rules (R10): no delivery-time, price, award or review
 * claims; the only place name used is "Delhi NCR"; British/Indian English. Titles stay short because the layout
 * template appends " · Fresh Petals India".
 */
export type Occasion = {
  slug: string;
  name: string;
  tag: string;
  /** <title> before the layout template appends the brand. */
  title: string;
  metaDescription: string;
  /** 80-120 words, shown under the heading. */
  intro: string;
  eyebrow?: string;
};

export const OCCASIONS: Occasion[] = [
  {
    slug: 'birthday',
    name: 'Birthday',
    tag: 'birthday',
    title: 'Birthday Flowers Online',
    metaDescription:
      'Birthday flowers in cheerful colours: sunflowers, carnations, gerberas and more, hand-selected stems to gift or arrange at home.',
    intro:
      'Birthday flowers should feel bright and generous. Sunflowers, carnations and gerberas bring warm, cheerful colour that suits almost any age, ' +
      'and alstroemeria and spray carnations give full bunches that keep opening for days. If you are unsure what to pick, choose two or three ' +
      'colours rather than one and add a few green stems for volume. Match the palette to the person: yellows and oranges feel playful, ' +
      'while soft pinks and whites are calmer. Tuck in a handwritten note, and remind the recipient to trim the stems at an angle and refresh the ' +
      'water every couple of days.',
  },
  {
    slug: 'anniversary',
    name: 'Anniversary',
    tag: 'anniversary',
    title: 'Anniversary Flowers Online',
    metaDescription:
      'Anniversary flowers that say it simply: roses, orchids, hydrangea and lisianthus, chosen in the colours that mean something to you.',
    intro:
      'An anniversary bouquet works best when it is personal. Roses remain the classic, and the colour carries the message: deep red for passion, ' +
      'blush pink for tenderness, white for a quiet fresh start. For something less expected, look at lisianthus, which resembles a soft rose, ' +
      'or hydrangea for a full, generous shape. Orchids last longest and suit a couple who prefer a plant-like gift on the table. ' +
      'A single colour in one type of flower usually looks more elegant than a mixed bunch. If you are marking a particular year, ' +
      'match the stem count to it and add a short handwritten card.',
  },
  {
    slug: 'wedding',
    name: 'Wedding',
    tag: 'wedding',
    title: 'Wedding Flowers Online',
    metaDescription:
      'Wedding flowers by the bunch: roses, lilies, hydrangea, lisianthus and tuberose for bouquets, mandaps, tables and gifts.',
    intro:
      'Wedding flowers are usually bought in quantity, so start with the flowers that carry the look. Roses and spray roses give a classic bridal ' +
      'shape, oriental lilies and tuberose add fragrance for a mandap or entrance, and hydrangea and lisianthus fill out table arrangements. ' +
      'Keep the palette to two or three colours and repeat them across bouquets, garlands and centrepieces so everything looks planned. ' +
      'Order a little more than you need, because some stems are lost to trimming and handling. For large or custom orders, send us ' +
      'an enquiry with your date and quantities and we will help you plan the mix.',
  },
  {
    slug: 'corporate',
    name: 'Corporate',
    tag: 'corporate',
    title: 'Corporate Flowers Online',
    metaDescription:
      'Corporate flowers for offices, reception desks, events and client gifts: orchids, anthurium, lilies and chrysanthemums.',
    intro:
      'Flowers in a workplace should look composed and last well, so structured, upright stems tend to work best. Orchids and anthurium hold their ' +
      'shape for a long time and suit reception desks and meeting rooms, while chrysanthemums and gladioli give height and colour for events ' +
      'and stage settings at a sensible budget. White, green and a single accent colour look professional and are easy to repeat across a venue. ' +
      'For client gifting across Delhi NCR, add a short note on a branded card. For bulk or recurring orders, send us an enquiry ' +
      'with your quantities and we will put a quote together.',
  },
  {
    slug: 'sympathy',
    name: 'Sympathy',
    tag: 'sympathy',
    title: 'Sympathy Flowers Online',
    metaDescription:
      'Sympathy flowers in calm whites and soft tones: lilies, chrysanthemums, tuberose and gladioli for tributes and condolence visits.',
    intro:
      'Sympathy flowers are about quiet respect rather than display. White and soft cream lilies are the most widely chosen, and chrysanthemums, ' +
      'which are used in remembrance in many cultures, hold up well through long ceremonies. Tuberose and gladioli add fragrance and height for ' +
      'a tribute or a stage arrangement. Keep colours restrained and avoid very bright mixes unless you know the family prefers them. ' +
      'If you are visiting a home, a simple bunch that can go straight into a vase is kinder than something that needs arranging. ' +
      'A short, sincere note says more than a long one.',
  },
  {
    slug: 'congratulations',
    name: 'Congratulations',
    tag: 'congratulations',
    title: 'Congratulations Flowers Online',
    metaDescription:
      'Congratulations flowers for new jobs, promotions, openings and milestones: lilies, orchids, gerberas and lisianthus.',
    intro:
      'A promotion, a new home, an exam result or a new business deserves flowers that feel like a celebration. Gerberas and alstroemeria give ' +
      'bold, happy colour, lilies and lisianthus add height and fragrance, and orchids suit a professional milestone because they last on a ' +
      'desk for weeks. Pick the mood before the flower: bright oranges and pinks for something joyful, whites and greens for a more ' +
      'formal congratulation. Tall bunches look generous without needing many types of stem. For an office or shop opening, ' +
      'consider a standing arrangement, and add a short card with your message.',
  },
  {
    slug: 'get-well-soon',
    name: 'Get Well Soon',
    tag: 'get-well-soon',
    title: 'Get Well Soon Flowers Online',
    metaDescription:
      'Get well soon flowers to lift a recovery: sunflowers, carnations, gerberas and chrysanthemums in bright, gentle colours.',
    intro:
      'Flowers for someone who is unwell should be cheerful without being heavy. Sunflowers, gerberas and carnations bring bright, sunny colour ' +
      'and have little scent, which matters in a hospital room or for someone sensitive to fragrance. Chrysanthemums are sturdy and last a long ' +
      'time, which helps when the vase is not changed often. Check the hospital rules first, as some wards do not allow fresh flowers, ' +
      'and a small bunch is easier for staff to accommodate than a large one. Add a short, warm note, and ask the recipient or a visitor ' +
      'to trim the stems and refresh the water.',
  },
  {
    slug: 'just-because',
    name: 'Just Because',
    tag: 'just-because',
    title: 'Just Because Flowers Online',
    metaDescription:
      'Just because flowers for no reason at all: roses, tulips, carnations, sunflowers and hydrangea to brighten a day or a home.',
    intro:
      'Some of the best flowers arrive with no occasion at all. A small, simple bunch of roses, carnations or sunflowers on an ordinary weekday ' +
      'says you were thinking of someone, and it costs far less effort than planning a celebration. For yourself, choose one type of flower ' +
      'in a colour you like and keep it in a plain vase; a single variety usually looks calmer and more modern than a mixed bunch. ' +
      'Hydrangea and liatris suit a larger, relaxed arrangement. Wherever they go, trim the stems at an angle and change the water ' +
      'every couple of days so the flowers stay fresh for as long as possible.',
  },
];

const BY_SLUG = new Map(OCCASIONS.map((o) => [o.slug, o]));
const BY_TAG = new Map(OCCASIONS.map((o) => [o.tag, o]));

export function getOccasion(slug: string): Occasion | undefined {
  return BY_SLUG.get(slug);
}

export function occasionForTag(tag: string): Occasion | undefined {
  return BY_TAG.get(tag);
}
