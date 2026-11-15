import { htmlToWhatsappText, WHATSAPP_TEXT_MAX_LENGTH } from './whatsapp-text';

describe('htmlToWhatsappText', () => {
  it('returns an empty string for an empty editor', () => {
    expect(htmlToWhatsappText('')).toBe('');
    expect(htmlToWhatsappText('<p><br></p>')).toBe('');
    expect(htmlToWhatsappText(null)).toBe('');
  });

  it('removes HTML tags from a paragraph (never sends markup to WhatsApp)', () => {
    expect(htmlToWhatsappText('<p>Bonjour Ada</p>')).toBe('Bonjour Ada');
  });

  it('maps bold, italic and strike to WhatsApp markers', () => {
    expect(htmlToWhatsappText('<p><strong>Promo</strong> du <em>jour</em> <s>ancien</s></p>')).toBe('*Promo* du _jour_ ~ancien~');
  });

  it('keeps line breaks between paragraphs and turns list items into bullets', () => {
    expect(htmlToWhatsappText('<p>Titre</p><ul><li>un</li><li>deux</li></ul><p>Fin</p>')).toBe('Titre\n• un\n• deux\nFin');
  });

  it('keeps links readable with their address', () => {
    expect(htmlToWhatsappText('<p><a href="https://nufisend.test">voir</a></p>')).toBe('voir (https://nufisend.test)');
  });

  it('decodes entities and keeps plain text untouched', () => {
    expect(htmlToWhatsappText('Prix &amp; remise&nbsp;!')).toBe('Prix & remise !');
    expect(htmlToWhatsappText('Bonjour {{receiverFullName}}')).toBe('Bonjour {{receiverFullName}}');
  });

  it('does not add markers around empty formatting', () => {
    expect(htmlToWhatsappText('<p>a<strong> </strong>b</p>')).toBe('a b');
  });

  it('exposes the WhatsApp text limit', () => {
    expect(WHATSAPP_TEXT_MAX_LENGTH).toBe(4096);
  });
});
