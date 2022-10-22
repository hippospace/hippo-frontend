import { Skeleton } from 'antd';
import classNames from 'classnames';
import Card from 'components/Card';
import { FC, ReactNode } from 'react';

interface ITopListProps {
  className?: string;
  title: string;
  cols: string[];
  flexs: (number | string)[];
  datas: ReactNode[][];
}

const TopList: FC<ITopListProps> = ({ className, title, cols, flexs, datas }) => {
  return (
    <div className={classNames(className)}>
      <div className="h5">{title}</div>
      <div className="mt-14">
        <div className="flex mb-4 pl-4">
          {cols.map((c: string, i: number) => (
            <div
              className="body-bold text-grey-500"
              key={`col-${i}`}
              style={{ flex: `${flexs[i]} ${flexs[i]} 0` }}>
              {c}
            </div>
          ))}
        </div>
        {datas.length > 0 ? (
          <div className="space-y-2">
            {datas.map((dr, index: number) => {
              return (
                <Card className="flex items-center pl-4" key={`row-${index}`}>
                  {dr.map((c, i) => {
                    return (
                      <div style={{ flex: `${flexs[i]} ${flexs[i]} 0` }} key={`item-${i}`}>
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
