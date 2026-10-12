/**
 * Occasion landing pages (/occasions/<slug>). `tag` is the Product.tags value the page filters on and always
 * equals `slug`; admins tag products with these values.
 *
 * Copy is DRAFT editorial text for the owner to review. Rules (R10): no delivery-time, price, award or review
 * claims; the only place name used is "Delhi NCR"; British/Indian English; only flowers the catalogue stocks are
 * named (no gerbera or tulip until they are); no sentence is reused between entries. Titles stay short because
 * the layout template appends " · Fresh Petals India".
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
      'Birthday flowers by the bunch: sunflowers, carnations, alstroemeria and spray roses in bright colours, to gift or arrange at home.',
    intro:
      'A birthday bunch can be as loud or as quiet as the person receiving it. Sunflowers and orange or yellow alstroemeria give a cheerful, sunny look, ' +
      'while spray carnations come in many colours and make a generous bunch from a single variety. For a softer gift, choose blush pink spray roses ' +
      'or pearl white carnations. Pick one dominant colour and let a second one support it, rather than mixing everything, and the bouquet will look planned. ' +
      'If the birthday belongs to someone far away, think about the colours they already wear or keep at home. ' +
      'A card in your own words will matter more than any extra stem.',
  },
  {
    slug: 'anniversary',
    name: 'Anniversary',
    tag: 'anniversary',
    title: 'Anniversary Flowers Online',
    metaDescription:
      'Anniversary flowers in roses, orchids, hydrangea and lisianthus: choose a colour that means something to the two of you.',
    intro:
      'Anniversary flowers work best when the choice feels personal. Roses are the familiar answer and the shade does the talking: a dark red rose reads as ' +
      'romantic, a blush pink one as gentle, a peach one as warm. If you want something less expected, lisianthus has the ruffled look of a rose without ' +
      'the thorns, and hydrangea gives a full, rounded head that fills a vase on its own. Dendrobium orchids sit well on a table and suit couples ' +
      'who prefer a plant-like gift. One variety in a single colour usually looks more deliberate than a mixed bunch. ' +
      'Count the stems to match the year if you like.',
  },
  {
    slug: 'wedding',
    name: 'Wedding',
    tag: 'wedding',
    title: 'Wedding Flowers Online',
    metaDescription:
      'Wedding flowers by the bunch: roses, lilies, hydrangea, lisianthus and tuberose for bouquets, mandaps, tables and favours.',
    intro:
      'Weddings need flowers in quantity, so begin with the ones that set the look. Roses and spray roses give a classic bridal shape, oriental lilies and ' +
      'tuberose add fragrance to a mandap or an entrance, and hydrangea and lisianthus fill out table arrangements. Settle on two or three colours and ' +
      'repeat them across bouquets, garlands and centrepieces so that everything reads as one scheme. Stems are lost to trimming and handling, so order ' +
      'a few more than the design strictly needs. For large or custom orders, send an enquiry with your date and quantities ' +
      'and we will talk through the mix with you.',
  },
  {
    slug: 'corporate',
    name: 'Corporate',
    tag: 'corporate',
    title: 'Corporate Flowers Online',
    metaDescription:
      'Flowers for offices, reception desks, events and client gifts: orchids, anthurium, lilies and chrysanthemums.',
    intro:
      'Workplace flowers should look composed and hold their shape, so structured, upright stems tend to suit best. Dendrobium and mokara orchids and ' +
      'anthurium stay presentable for a long time on a reception desk or in a meeting room, while gladioli and chrysanthemums add height and colour ' +
      'to an event or a stage. White, green and a single accent colour are easy to repeat across a venue and sit comfortably with most brand palettes. ' +
      'For client gifts in Delhi NCR, a printed message can accompany each bouquet. Bulk and recurring requirements are handled through an enquiry: ' +
      'send quantities and dates and we will put a quote together.',
  },
  {
    slug: 'sympathy',
    name: 'Sympathy',
    tag: 'sympathy',
    title: 'Sympathy Flowers Online',
    metaDescription:
      'Sympathy flowers in white and cream: lilies, white chrysanthemums, tuberose and gladioli for tributes and condolence visits.',
    intro:
      'Sympathy flowers are chosen for quiet respect rather than display, and in many families white is the expected colour. Pearl white lilies and ' +
      'chrysanthemums are familiar at memorial services, and tuberose, known as rajnigandha, adds a strong fragrance that many people link with ' +
      'remembrance. Gladioli give height for a tribute or a stage arrangement. If you are unsure of the family’s customs, ask someone close ' +
      'to them before ordering, as practices differ between communities. For a visit to the home, a bunch that can go straight into a vase ' +
      'is easier for the family than one that needs arranging.',
  },
  {
    slug: 'congratulations',
    name: 'Congratulations',
    tag: 'congratulations',
    title: 'Congratulations Flowers Online',
    metaDescription:
      'Congratulations flowers for new jobs, promotions, openings and milestones: lilies, orchids, alstroemeria and lisianthus.',
    intro:
      'A promotion, a new home, an exam result or a new shop deserves flowers that feel like a celebration. Alstroemeria and snapdragons bring bold colour, ' +
      'lilies and lisianthus add height and scent, and dendrobium orchids suit a professional milestone and look at home on a desk. ' +
      'Choose the mood before the flower: oranges and pinks for something joyful, white and green for a more formal message. ' +
      'Tall bunches look generous without needing many different stems. For an office or shop opening, consider a standing arrangement ' +
      'and ask us about sizes through an enquiry.',
  },
  {
    slug: 'get-well-soon',
    name: 'Get Well Soon',
    tag: 'get-well-soon',
    title: 'Get Well Soon Flowers Online',
    metaDescription:
      'Get well soon flowers to cheer a recovery: sunflowers, carnations, alstroemeria and spray roses in bright, gentle colours.',
    intro:
      'Flowers for someone who is unwell should cheer without overwhelming. Sunflowers and yellow alstroemeria bring daylight into a room, and carnations ' +
      'are a restrained choice for a bedside, with a light, spicy clove scent that is gentler than lilies or tuberose. Check the ward’s rules before ' +
      'you send anything, as some hospitals do not allow fresh flowers or ask for small bunches only. A compact arrangement is easier for nursing staff ' +
      'to place than a tall one. If the patient is sensitive to smell, skip the strongly scented stems and send flowers to the home after discharge.',
  },
  {
    slug: 'just-because',
    name: 'Just Because',
    tag: 'just-because',
    title: 'Just Because Flowers Online',
    metaDescription:
      'Just because flowers for an ordinary day: roses, carnations, sunflowers, hydrangea and liatris to brighten a room or say hello.',
    intro:
      'Some flowers arrive with no occasion attached, and those are often the ones people remember. A small bunch of roses, carnations or sunflowers on an ordinary weekday tells someone you ' +
      'were thinking of them, and it needs far less planning than a celebration. For your own home, pick one type of flower in a colour you like and put it ' +
      'in a plain vase; a single variety usually looks calmer than a mixed bunch. Hydrangea and liatris suit a larger, relaxed arrangement. ' +
      'Whatever you choose, cut the stems on a slant and change the water every couple of days so the flowers last as long as they can.',
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
