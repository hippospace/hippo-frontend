import { FC, useCallback, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { TooltipProps } from 'recharts';
import Card from 'components/Card';
import { numberGroupFormat, numberOfAbbr } from 'components/PositiveFloatNumInput/numberFormats';
import styles from './VolumeChart.module.scss';
import classNames from 'classnames';

const CustomTooltip: FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    // console.log('payload', JSON.stringify(payload));
    return (
      <Card className="p-4">
        <p className="body-medium text-grey-500">{`${payload[0].payload.label}`}</p>
        <p className="h6 text-grey-900 mt-2">
          ${numberGroupFormat((payload[0].value || 0) as number, 0)}
        </p>
      </Card>
    );
  }
  return null;
};

interface VolumeData {
  time?: number;
  name: string;
  label: string;
  amount: number;
}

const VolumeChart = ({ data = [] }: { data: VolumeData[] }) => {
  // TODO: chart loading
  const containerRef = useRef<HTMLDivElement>(null);

  const barWidth = useMemo(() => {
    const chartXOffset = 60;
    const minGap = 6;
    const w =
      ((containerRef.current?.offsetWidth || 0) - chartXOffset - minGap) / data.length - minGap;
    return Math.max(Math.min(w, 60), 8);
  }, [data.length]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleMouseEnterBar = useCallback((_data: unknown, index: number) => {
    setHoverIndex(index);
  }, []);

  const handleMouseLeaveBar = useCallback(() => {
    setHoverIndex(null);
  }, []);

  return (
    <div className={classNames(styles.volumeChart, 'w-full h-[540px]')} ref={containerRef}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 40
          }}>
          <CartesianGrid strokeDasharray="2 10" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tickMargin={26}
            tick={data.length !== 0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickCount={4}
            tickMargin={24}
            tick={data.length !== 0}
            tickFormatter={(v) => (typeof v === 'number' ? numberOfAbbr(v, 0) : v)}
          />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            radius={[barWidth, barWidth, barWidth, barWidth]}
            barSize={barWidth}
            onMouseEnter={handleMouseEnterBar}
            onMouseLeave={handleMouseLeaveBar}>
            {data.map((entry, index) => (
              <Cell
                cursor="auto"
                fill={index !== hoverIndex ? '#CDC1FF' : '#8D78F7'}
                key={`cell-${index}`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeChart;
