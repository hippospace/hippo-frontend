import { FC } from 'react';
import LoadingSkeleton, { SkeletonProps as LoadingSkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Skeleton: FC<LoadingSkeletonProps> = ({ baseColor, highlightColor, ...rest }) => {
  return <LoadingSkeleton {...rest} baseColor={baseColor} highlightColor={highlightColor} />;
};

export default Skeleton;
