// 10 Official Artist Photos for Kungnoi Y. — "ถ้าเธอยังไม่ลืม" Official Debut Album
import { ARTIST_PHOTOS } from './images';

export interface PresetSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  url: string;
}

export const DEFAULT_SLIDES_PRESETS: PresetSlide[] = [
  {
    id: 'slide-1',
    title: 'แทร็ก 01 • ถ้าเธอยังไม่ลืม',
    subtitle: 'Track 01 ✦ If You Haven\'t Forgotten (Debut Title Track)',
    description: 'เพลงไตเติลหลักเดบิวต์อัลบั้ม Kungnoi Y. รอยยิ้มอบอุ่นน่ารัก สดใสเป็นธรรมชาติ',
    tag: 'แทร็ก 01 • Title Track',
    url: ARTIST_PHOTOS[0].url
  },
  {
    id: 'slide-2',
    title: 'แทร็ก 02 • อย่ามองแบบนั้น',
    subtitle: 'Track 02 ✦ Don\'t Look At Me Like That (Sunny Garden)',
    description: 'รอยยิ้มสดใสกลางแจ้ง เสื้อลายดอกไม้สีเหลือง',
    tag: 'แทร็ก 02 • Single',
    url: ARTIST_PHOTOS[1].url
  },
  {
    id: 'slide-3',
    title: 'แทร็ก 03 • ใจกลัว...แต่ยังรัก',
    subtitle: 'Track 03 ✦ Afraid Heart... Still In Love (Cafe Archway)',
    description: 'มุมสง่างามและมีเสน่ห์ ณ ประตูโค้งไม้ในคาเฟ่ ถ่ายทอดความรู้สึกซึ้งตรึงใจ',
    tag: 'แทร็ก 03 • Soul Pop',
    url: ARTIST_PHOTOS[2].url
  },
  {
    id: 'slide-4',
    title: 'แทร็ก 04 • คืนที่ไม่มีคำลา',
    subtitle: 'Track 04 ✦ Night Without Goodbye (Sunset Rooftop)',
    description: 'ยามเย็นแสงสีทองบนดาดฟ้า กับความทรงจำแสนหวานที่ไม่เคยลบเลือน',
    tag: 'แทร็ก 04 • Midnight Mood',
    url: ARTIST_PHOTOS[3].url
  },
  {
    id: 'slide-5',
    title: 'แทร็ก 05 • ปล่อยให้เวลาพาเธอไป',
    subtitle: 'Track 05 ✦ Let Time Drift You Away (Pure Uniform)',
    description: 'รอยยิ้มจริงใจในชุดยูนิฟอร์มสีขาวเรียบหรู ปล่อยวางทุกสิ่งและก้าวต่อไป',
    tag: 'แทร็ก 05 • Chill R&B',
    url: ARTIST_PHOTOS[4].url
  },
  {
    id: 'slide-6',
    title: 'แทร็ก 06 • ไม่ได้อยากเป็นคนพิเศษ',
    subtitle: 'Track 06 ✦ Never Wanted To Be Special (Pink Polo)',
    description: 'ลุคน่ารักสดใสกับเสื้อโปโลสีชมพู รอยยิ้มที่มองแล้วมีความสุข',
    tag: 'แทร็ก 06 • Acoustic Mood',
    url: ARTIST_PHOTOS[5].url
  },
  {
    id: 'slide-7',
    title: 'แทร็ก 07 • Between Us',
    subtitle: 'Track 07 ✦ Between Us (Cozy Sweater)',
    description: 'สเวตเตอร์สีชมพูพร้อมกระเป๋าสะพาย ความรู้สึกดีๆ ที่เข้าใจกัน',
    tag: 'แทร็ก 07 • R&B Pop',
    url: ARTIST_PHOTOS[6].url
  },
  {
    id: 'slide-8',
    title: 'แทร็ก 08 • Still Think About Us',
    subtitle: 'Track 08 ✦ Still Think About Us (Medical White Coat)',
    description: 'มุมอ่อนโยนในเสื้อกาวน์สีขาวสะอาดตา ความสดใสเปล่งประกาย',
    tag: 'แทร็ก 08 • Special Single',
    url: ARTIST_PHOTOS[7].url
  },
  {
    id: 'slide-9',
    title: 'แทร็ก 09 • ลบไม่ได้...ช่วยไม่คิดถึง',
    subtitle: 'Track 09 ✦ Can\'t Erase... Help Me Forget (Radiant Sunglasses)',
    description: 'ความสดใสเปล่งประกาย แว่นกันแดดสุดชิค รอยยิ้มพิมพ์ใจ',
    tag: 'แทร็ก 09 • Deep Emotion',
    url: ARTIST_PHOTOS[8].url
  },
  {
    id: 'slide-10',
    title: 'แทร็ก 10 • ถ้าเธอยังไม่ลืม (Acoustic Ver.)',
    subtitle: 'Track 10 ✦ If You Haven\'t Forgotten - Acoustic (Gentle Close-up)',
    description: 'รอยยิ้มละมุนหัวใจ โคลสอัพใกล้ชิด นั่งฟังบทเพลงอะคูสติกสุดซึ้ง',
    tag: 'แทร็ก 10 • Acoustic Master',
    url: ARTIST_PHOTOS[9].url
  }
];
