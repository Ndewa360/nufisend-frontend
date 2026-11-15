import { cloudAttachmentErrorOf } from './attachment-rules';

const MB = 1024 * 1024;
const file = (name: string, size: number) => {
  const f = new File(['x'], name);
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('cloudAttachmentErrorOf (WhatsApp Business rules)', () => {
  it('accepts a JPEG up to 5 MB', () => {
    expect(cloudAttachmentErrorOf(file('photo.jpg', 4 * MB))).toBeNull();
  });

  it('refuses an image above 5 MB', () => {
    expect(cloudAttachmentErrorOf(file('photo.png', 6 * MB))).toContain('maximum 5 Mo');
  });

  it('accepts a 16 MB video and refuses a larger one', () => {
    expect(cloudAttachmentErrorOf(file('clip.mp4', 15 * MB))).toBeNull();
    expect(cloudAttachmentErrorOf(file('clip.mp4', 17 * MB))).toContain('maximum 16 Mo');
  });

  it('accepts a 90 MB PDF', () => {
    expect(cloudAttachmentErrorOf(file('devis.pdf', 90 * MB))).toBeNull();
  });

  it('refuses formats that the Cloud API does not accept (GIF, WebP, CSV)', () => {
    expect(cloudAttachmentErrorOf(file('anim.gif', 100))).toContain('non pris en charge');
    expect(cloudAttachmentErrorOf(file('sticker.webp', 100))).toContain('non pris en charge');
    expect(cloudAttachmentErrorOf(file('liste.csv', 100))).toContain('non pris en charge');
  });
});
