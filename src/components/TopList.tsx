import { Skeleton } from 'antd';
import classNames from 'classnames';
import Card from 'components/Card';
import { ElementType, FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { CaretIcon } from 'resources/icons';

type Flex = number | string | (number | string)[];

interface ITopListProps {
  className?: string;
  rowClassName?: (index: number) => string;
  title: string;
  cols: string[] | ReactNode[];
  flexs: Flex[];
  datas: ReactNode[][] | undefined;
  maxColumns?: number;
  RowComp?: ((props: any) => JSX.Element) | ElementType;
  onClickRow?: (row: number) => void;
  isLoading?: boolean;
}

const TopList: FC<ITopListProps> = ({
  className,
  rowClassName = () => '',
  title,
  cols,
  flexs,
  datas,
  maxColumns,
  RowComp = Card,
  onClickRow = () => {},
  isLoading = false
}) => {
  const flex = useCallback(
    (i: number) => {
      if (!Array.isArray(flexs[i])) {
        return `${flexs[i]} ${flexs[i]} 0`;
      } else {
        return (flexs[i] as Array<number | string>).join(' ');
      }
    },
    [flexs]
  );

  const [isUnfolded, setIsUnfolded] = useState(false);
  const displayColumns = useMemo(() => {
    if (maxColumns === undefined || isUnfolded) {
      return datas?.length ?? 0;
    } else {
      return maxColumns;
    }
  }, [datas?.length, isUnfolded, maxColumns]);

  return (
    <div className={classNames(className)}>
      <div className="h5">{title}</div>
      <div className="">
        <div className="flex mb-4 px-4 mobile:px-2">
          {cols.map((c: string | ReactNode, i: number) => (
            <div
              className="body-bold text-grey-500 mobile:label-large-bold"
              key={`col-${i}`}
              style={{ flex: flex(i) }}>
              {c}
            </div>
          ))}
        </div>
        {datas && !isLoading ? (
          datas.length > 0 ? (
            <div className="space-y-2">
              {datas.slice(0, displayColumns).map((dr, index: number) => {
                return (
                  <RowComp
                    className={classNames('flex items-center px-4', rowClassName(index))}
                    key={`row-${index}`}
                    onClick={() => onClickRow(index)}>
                    {dr.map((c, i) => {
                      return (
                        <div style={{ flex: flex(i) }} key={`item-${i}`}>
                          {c}
                        </div>
                      );
                    })}
                  </RowComp>
                );
              })}
              {maxColumns !== undefined && datas.length > maxColumns && (
                <div className="flex justify-center items-center h-16">
                  <span
                    className="cursor-pointer text-grey-700 label-large-bold"
                    onClick={() => setIsUnfolded(!isUnfolded)}>
                    Show{' '}
                    {datas.length > displayColumns ? (
                      <>
                        more <CaretIcon className="font-icon ml-2" />
                      </>
                    ) : (
                      <>
                        less <CaretIcon className="font-icon ml-2 rotate-180 origin-center" />
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[200px] h5 flex items-center justify-center text-grey-500">
              No data
            </div>
          )
        ) : (
          <div className="space-y-10 pt-8">
            <Skeleton active />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopList;
