// Kungnoi Y. Official Photo Assets - 10 Slide Photos
import slide01 from '../assets/images/slide_01.jpg';
import slide02 from '../assets/images/slide_02.jpg';
import slide03 from '../assets/images/slide_03.jpg';
import slide04 from '../assets/images/slide_04.jpg';
import slide05 from '../assets/images/slide_05.jpg';
import slide06 from '../assets/images/slide_06.jpg';
import slide07 from '../assets/images/slide_07.jpg';
import slide08 from '../assets/images/slide_08.jpg';
import slide09 from '../assets/images/slide_09.jpg';
import slide10 from '../assets/images/slide_10.jpg';

export const ARTIST_PHOTOS = [
  {
    id: 'photo-1',
    url: slide01,
    title: 'Kungnoi Y. Portrait 01',
    caption: 'ภาพที่ 1 • รอยยิ้มอบอุ่นน่ารัก สดใสเป็นธรรมชาติ',
    tag: 'ภาพที่ 1 • Portrait 01'
  },
  {
    id: 'photo-2',
    url: slide02,
    title: 'Sunny Floral Garden',
    caption: 'ภาพที่ 2 • รอยยิ้มสดใสกลางแจ้ง เสื้อลายดอกไม้สีเหลือง',
    tag: 'ภาพที่ 2 • Portrait 02'
  },
  {
    id: 'photo-3',
    url: slide03,
    title: 'Cafe Archway Side Profile',
    caption: 'ภาพที่ 3 • มุมสง่างามและมีเสน่ห์ ณ ประตูโค้งไม้ในคาเฟ่',
    tag: 'ภาพที่ 3 • Portrait 03'
  },
  {
    id: 'photo-4',
    url: slide04,
    title: 'Sunset Rooftop Memories',
    caption: 'ภาพที่ 4 • ยามเย็นแสงสีทองบนดาดฟ้า กับความทรงจำแสนหวาน',
    tag: 'ภาพที่ 4 • Portrait 04'
  },
  {
    id: 'photo-5',
    url: slide05,
    title: 'Sweet Student Uniform',
    caption: 'ภาพที่ 5 • รอยยิ้มจริงใจในชุดยูนิฟอร์มสีขาวเรียบหรู',
    tag: 'ภาพที่ 5 • Portrait 05'
  },
  {
    id: 'photo-6',
    url: slide06,
    title: 'Pink Polo & Casual Charm',
    caption: 'ภาพที่ 6 • ลุคน่ารักสดใสกับเสื้อโปโลสีชมพู',
    tag: 'ภาพที่ 6 • Portrait 06'
  },
  {
    id: 'photo-7',
    url: slide07,
    title: 'Pink Sweater & Shoulder Bag',
    caption: 'ภาพที่ 7 • สเวตเตอร์สีชมพูพร้อมกระเป๋าสะพาย รอยยิ้มสดใส',
    tag: 'ภาพที่ 7 • Portrait 07'
  },
  {
    id: 'photo-8',
    url: slide08,
    title: 'Professional Medical White Coat',
    caption: 'ภาพที่ 8 • มุมอ่อนโยนในเสื้อกาวน์สีขาวสะอาดตา',
    tag: 'ภาพที่ 8 • Portrait 08'
  },
  {
    id: 'photo-9',
    url: slide09,
    title: 'Radiant Glow & Sunglasses',
    caption: 'ภาพที่ 9 • ความสดใสเปล่งประกาย แว่นกันแดดสุดชิค',
    tag: 'ภาพที่ 9 • Portrait 09'
  },
  {
    id: 'photo-10',
    url: slide10,
    title: 'Gentle Smile Close-up',
    caption: 'ภาพที่ 10 • รอยยิ้มละมุนหัวใจ โคลสอัพใกล้ชิด',
    tag: 'ภาพที่ 10 • Portrait 10'
  }
];

export const IMAGES = {
  bandLogo: slide09,
  heroBanner: slide04,
  albumCover: slide01,
  winPortrait: slide01,
  nightPortrait: slide01,
  tenPortrait: slide02,
  tigerPortrait: slide03,
  monaPortrait: slide08,
  photo1: slide01,
  photo2: slide02,
  photo3: slide03,
  photo4: slide04,
  photo5: slide05,
  photo6: slide06,
  photo7: slide07,
  photo8: slide08,
  photo9: slide09,
  photo10: slide10,
  bandSilhouette: slide04,
  
  // Official Photo Gallery
  gallery: ARTIST_PHOTOS.map((p, idx) => ({
    id: `g${idx + 1}`,
    title: p.title,
    category: "Kungnoi Y. Official",
    url: p.url,
    caption: p.caption
  }))
};
