import group1 from '../../../assets/staff/banner/group1.svg';
import group10 from '../../../assets/staff/banner/group10.svg';
import group11 from '../../../assets/staff/banner/group11.svg';
import group12 from '../../../assets/staff/banner/group12.svg';
import group13 from '../../../assets/staff/banner/group13.svg';
import group14 from '../../../assets/staff/banner/group14.svg';
import group15 from '../../../assets/staff/banner/group15.svg';
import group16 from '../../../assets/staff/banner/group16.svg';
import group17 from '../../../assets/staff/banner/group17.svg';
import group18 from '../../../assets/staff/banner/group18.svg';
import group19 from '../../../assets/staff/banner/group19.svg';
import group2 from '../../../assets/staff/banner/group2.svg';
import group20 from '../../../assets/staff/banner/group20.svg';
import group3 from '../../../assets/staff/banner/group3.svg';
import group4 from '../../../assets/staff/banner/group4.svg';
import group5 from '../../../assets/staff/banner/group5.svg';
import group6 from '../../../assets/staff/banner/group6.svg';
import group7 from '../../../assets/staff/banner/group7.svg';
import group8 from '../../../assets/staff/banner/group8.svg';
import group9 from '../../../assets/staff/banner/group9.svg';
import vector from '../../../assets/staff/banner/vector.svg';
import vector1 from '../../../assets/staff/banner/vector1.svg';
import vector2 from '../../../assets/staff/banner/vector2.svg';
import vector3 from '../../../assets/staff/banner/vector3.svg';
import vector4 from '../../../assets/staff/banner/vector4.svg';
import vector5 from '../../../assets/staff/banner/vector5.svg';
import vector6 from '../../../assets/staff/banner/vector6.svg';
import vector7 from '../../../assets/staff/banner/vector7.svg';
import vector8 from '../../../assets/staff/banner/vector8.svg';
import vector9 from '../../../assets/staff/banner/vector9.svg';
import styles from './StaffBannerArt.module.css';

// Decorative art of the Staff Management banner (Figma 13009:17944): the waves (13009:17945) and the
// illustration (13009:17982), rebuilt from the Figma pieces with the insets, masks and rotations that
// get_design_context returned for the 1129 x 168 banner. Hidden from assistive technology.

// The wave lines, each a group clipped by a mask (positions and sizes in px, from Figma).
const WAVES = [
  { inset: '16.51% -9.63% 40.98% -4.97%', src: group2, mask: group1, position: '42.019px -90.392px' },
  { inset: '18.42% -10.71% 53.88% -13.38%', src: group3, mask: group1, position: '135.701px -96.564px' },
  { inset: '21.61% -9.72% 30.63% -6.97%', src: group4, mask: group1, position: '61.768px -110.993px' },
  { inset: '14.89% -12.95% 36.31% -14.62%', src: group6, mask: group5, position: '151.558px -78.867px' },
];
const WAVE_MASK_SIZE = '1176.452px 538.498px';

// The illustration pieces, in Figma's paint order. `rotated` pieces are drawn at -45° inside their box;
// `mask` pieces are clipped by another piece.
const ILLUSTRATION = [
  { inset: '12.84% 12.39% 12.03% 12%', src: vector1 },
  { inset: '12.5% 16.89% 16.51% 17.18%', src: group7 },
  { inset: '17.15% 29.05% 66.1% 54.19%', src: vector2, rotated: true },
  { inset: '17.92% 29.87% 66.84% 54.89%', src: vector3, rotated: true },
  {
    inset: '20.47% 32.31% 68.78% 57.45%',
    src: group9,
    mask: group8,
    position: '-5.053px -5.008px',
    size: '30.475px 30.475px',
  },
  { inset: '14.85% 18.01% 69.79% 66.64%', src: vector4, rotated: true },
  { inset: '17.61% 20.8% 72.52% 69.32%', src: vector5 },
  {
    inset: '18.71% 21.74% 72.36% 70.47%',
    src: group11,
    mask: group10,
    position: '-2.237px -2.116px',
    size: '19.746px 19.746px',
  },
  { inset: '32.58% 28.84% 55.15% 58.89%', src: vector6 },
  { inset: '33.16% 29.46% 55.69% 59.39%', src: vector7 },
  {
    inset: '33.44% 30.6% 55.62% 61.11%',
    src: group13,
    mask: group12,
    position: '-3.371px -0.491px',
    size: '22.313px 22.313px',
  },
  { inset: '28.63% 16.62% 60.34% 72.35%', src: vector8 },
  { inset: '27.07% 15.09% 58.74% 70.72%', src: vector9, rotated: true },
  {
    inset: '29.73% 18.31% 60.27% 72.43%',
    src: group15,
    mask: group14,
    position: '-3.364px -5.242px',
    size: '28.386px 28.386px',
  },
  { inset: '33.76% 67.5% 57.48% 23.75%', src: group16 },
  { inset: '27.89% 60.67% 63.36% 30.57%', src: group17 },
  { inset: '37.15% 59.95% 55.28% 32.48%', src: group18 },
  { inset: '36.36% 40.42% 12.47% 30.38%', src: group19 },
  { inset: '59.48% 31.29% 12.06% 51.96%', src: group20 },
];

const maskStyle = (mask, position, size) => ({
  maskImage: `url("${mask}")`,
  maskPosition: position,
  maskSize: size,
});

function Piece({ inset, src, rotated, mask, position, size }) {
  if (rotated) {
    return (
      <div className={styles.rotatedBox} style={{ inset }}>
        <div className={styles.rotated}>
          <img src={src} alt="" className={styles.fill} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${styles.piece} ${mask ? styles.masked : ''}`}
      style={{ inset, ...(mask && maskStyle(mask, position, size)) }}
    >
      <img src={src} alt="" className={styles.fill} />
    </div>
  );
}

export default function StaffBannerArt() {
  return (
    <div className={styles.art} aria-hidden="true">
      <div className={styles.wavesBox}>
        <div className={styles.wavesTilt}>
          <div className={styles.piece} style={{ inset: '-9.27% 0.03% 13.41% 0' }}>
            <img src={vector} alt="" className={styles.fill} />
          </div>
          {WAVES.map((wave) => (
            <Piece key={wave.position} {...wave} size={WAVE_MASK_SIZE} />
          ))}
        </div>
      </div>
      <div className={styles.illustration}>
        {ILLUSTRATION.map((piece) => (
          <Piece key={piece.inset} {...piece} />
        ))}
      </div>
    </div>
  );
}
