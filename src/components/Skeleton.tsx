import { FC } from 'react';
import LoadingSkeleton, { SkeletonProps as LoadingSkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useIsDarkMode } from './Settings';

const Skeleton: FC<LoadingSkeletonProps> = ({ baseColor, highlightColor, ...rest }) => {
  const isDark = useIsDarkMode();
  if (isDark) {
    baseColor = '#2D2D2D';
    highlightColor = '#3F3F3F';
  }
  return <LoadingSkeleton {...rest} baseColor={baseColor} highlightColor={highlightColor} />;
};

export default Skeleton;
