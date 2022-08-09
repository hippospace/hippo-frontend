import styles from './AnimatedBackground.module.scss';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import Vec1 from 'resources/img/animatedBg/vector-1.svg';
import Vec2 from 'resources/img/animatedBg/vector-2.svg';
import Vec3 from 'resources/img/animatedBg/vector-3.svg';
import Vec4 from 'resources/img/animatedBg/vector-4.svg';
import Vec5 from 'resources/img/animatedBg/vector-5.svg';

const AnimatedBackground: React.FC = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const updateSize = useCallback(() => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }, []);
  useEffect(() => {
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [updateSize]);
  const rw = width / 1920;
  const rh = height / 1080;
  return (
    <div className="absolute w-full h-full left-0 right-0 top-0 bottom-0 overflow-hidden z-0">
      <img
        src={Vec2}
        className={classNames('absolute', styles.vc2)}
        style={{
          width: `${rw * (1068 + 120 * 2)}px`,
          height: `${rh * (753 + 120 * 2)}px`,
          top: `${rh * (-47 - 120)}px`,
          left: `${rw * (-108 - 120)}px`
        }}
      />
      <img
        src={Vec3}
        className={classNames('absolute', styles.vc3)}
        style={{
          width: `${rw * (1341 + 100 * 2)}px`,
          height: `${rh * (1076 + 100 * 2)}px`,
          top: `${rh * (-363 - 100)}px`,
          left: `${rw * (739 - 100)}px`
        }}
      />
      <img
        src={Vec4}
        className={classNames('absolute', styles.vc4)}
        style={{
          width: `${rw * (837 + 100 * 2)}px`,
          height: `${rh * (1273 + 100 * 2)}px`,
          top: `${rh * (153 - 100)}px`,
          left: `${rw * (63 - 100)}px`
        }}
      />
      <img
        src={Vec5}
        className={classNames('absolute', styles.vc5)}
        style={{
          width: `${rw * (764 + 120 * 2)}px`,
          height: `${rh * (1453 + 120 * 2)}px`,
          top: `${rh * (86 - 120)}px`,
          left: `${rw * (1010 - 120)}px`
        }}
      />
      <img
        src={Vec1}
        className={classNames('absolute', styles.vc1)}
        style={{
          width: `${rw * (699 + 120 * 2)}px`,
          height: `${rh * (800 + 120 * 2)}px`,
          top: `${rh * (583 - 120)}px`,
          left: `${rw * (572 - 120)}px`
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
