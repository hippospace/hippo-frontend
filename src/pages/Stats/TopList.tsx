import { Skeleton } from 'antd';
import classNames from 'classnames';
import Card from 'components/Card';
import { FC, ReactNode, useCallback } from 'react';

type Flex = number | string | (number | string)[];

interface ITopListProps {
  className?: string;
  title: string;
  cols: string[] | ReactNode[];
  flexs: Flex[];
  datas: ReactNode[][];
}

const TopList: FC<ITopListProps> = ({ className, title, cols, flexs, datas }) => {
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

  return (
    <div className={classNames(className)}>
      <div className="h5">{title}</div>
      <div className="mt-14">
        <div className="flex mb-4 px-4">
          {cols.map((c: string | ReactNode, i: number) => (
            <div className="body-bold text-grey-500" key={`col-${i}`} style={{ flex: flex(i) }}>
              {c}
            </div>
          ))}
        </div>
        {datas.length > 0 ? (
          <div className="space-y-2">
            {datas.map((dr, index: number) => {
              return (
                <Card className="flex items-center px-4" key={`row-${index}`}>
                  {dr.map((c, i) => {
                    return (
                      <div style={{ flex: flex(i) }} key={`item-${i}`}>
                        {c}
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        ) : (
          <Skeleton active />
        )}
      </div>
    </div>
  );
};

export default TopList;
