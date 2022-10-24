import { hippo_aggregator } from '@manahippo/hippo-sdk';
import { Segmented, Skeleton } from 'antd';
import classNames from 'classnames';
import PoolProvider from 'components/PoolProvider';
import { numberGroupFormat, numberOfAbbr } from 'components/PositiveFloatNumInput/numberFormats';
import TradingPair from 'components/TradingPair';
import useHippoClient from 'hooks/useHippoClient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays } from 'utils/utility';
import styles from './Stats.module.scss';
import TopList from './TopList';
import VolumeChart from './VolumeChart';

const Periods = ['24H', '1 Week'] as const;
type Peroid = typeof Periods[number];

const utcDate = (date: Date) => {
  const dateString = date.toUTCString();
  return dateString.substring(0, dateString.length - 13);
};

const utcTime = (date: Date) => {
  const dateString = date.toUTCString();
  return dateString.substring(0, dateString.length - 7);
};

const Stats = () => {
  const [statsPeriod, setStatsPeriod] = useState<Peroid>('24H');

  const [volume, setVolume] = useState<hippo_aggregator.Volume.Volume | null>(null);
  const volumeScale = useMemo(
    () => 10 ** (volume?.volume_decimals.toJsNumber() || 0),
    [volume?.volume_decimals]
  );

  const topPoolProviders2 = useMemo(() => {
    if (!volume) return [];
    const pps = statsPeriod === '24H' ? volume.top_pool_provider_24h : volume.top_pool_provider_7d;
    return pps.map((pp, index) => {
      return [
        // eslint-disable-next-line react/jsx-key
        <div className="flex h-[65px] items-center">
          <span className="w-5 body-bold text-grey-700">{index + 1}</span>
          <PoolProvider dexType={pp.dex_type.toJsNumber()} />
        </div>,
        // eslint-disable-next-line react/jsx-key
        <>
          <span className="body-bold text-grey-700 mobile:hidden">
            ${numberGroupFormat(pp.amount.toJsNumber() / volumeScale, 0)}
          </span>
          <span className="body-bold text-grey-700 hidden mobile:block">
            ${numberOfAbbr(pp.amount.toJsNumber() / volumeScale, 1)}
          </span>
        </>
      ];
    });
  }, [statsPeriod, volume, volumeScale]);

  const topTradingPairs2 = useMemo(() => {
    if (!volume) return [];
    const tps = statsPeriod === '24H' ? volume.top_trading_pairs_24h : volume.top_trading_pairs_7d;
    return tps.map((tp, index) => {
      return [
        // eslint-disable-next-line react/jsx-key
        <div className="flex h-[65px] items-center">
          <span className="w-5 body-bold text-grey-700">{index + 1}</span>
          <TradingPair base={tp.coin_x.str()} quote={tp.coin_y.str()} />
        </div>,
        // eslint-disable-next-line react/jsx-key
        <>
          <span className="body-bold text-grey-700 mobile:hidden">
            ${numberGroupFormat(tp.amount.toJsNumber() / volumeScale, 0)}
          </span>
          <span className="body-bold text-grey-700 hidden mobile:block">
            ${numberOfAbbr(tp.amount.toJsNumber() / volumeScale, 1)}
          </span>
        </>
      ];
    });
  }, [statsPeriod, volume, volumeScale]);

  const historyVolumes = useMemo(() => {
    if (!volume) return [];
    // Max length of total_volume_history_24h/total_volume_history_7d is now 30
    const tvh =
      statsPeriod === '24H'
        ? volume.total_volume_history_24h.slice(0, 30)
        : volume.total_volume_history_7d.slice(0, 30);
    return tvh.map((v) => {
      const time = v.start_time.toJsNumber();
      const name =
        '' + (statsPeriod === '24H' ? new Date(time).getUTCDate() : new Date(time).getUTCDate());
      const startDate = utcDate(new Date(time));
      const endDate = utcDate(addDays(new Date(time), 6));
      const label =
        statsPeriod === '24H' ? `${startDate} (UTC)` : `${startDate} ~ ${endDate} (UTC)`;
      return {
        time,
        name,
        label,
        amount: v.amount.toJsNumber() / volumeScale
      };
    });
    /*
    return new Array(30).fill(0).map((_, index) => ({
      amount: Math.random() * 10000,
      name: '' + index,
      label: '' + index
    }));
    */
  }, [statsPeriod, volume, volumeScale]);

  const volumeInPeriod = useMemo(() => {
    // TODO: change to realtime value
    if (!volume) return null;
    const dataEndTime = volume.data_end_time.toJsNumber();
    if (statsPeriod === '24H') {
      return {
        peroid:
          utcTime(new Date(dataEndTime - 24 * 60 * 60 * 1000)) +
          ' ~ ' +
          utcTime(new Date(dataEndTime)) +
          ' (UTC)',
        amount: volume.last_24h_volume.toJsNumber() / volumeScale
      };
    } else if (statsPeriod === '1 Week') {
      const volumeWeek = volume.total_volume_history_7d.slice(-2)[0];
      console.log('volumeWeek', volumeWeek.amount.toJsNumber());
      return {
        peroid:
          utcTime(new Date(dataEndTime - 7 * 24 * 60 * 60 * 1000)) +
          ' ~ ' +
          utcTime(new Date(dataEndTime)) +
          ' (UTC)',
        amount: volume.last_7d_volume.toJsNumber() / volumeScale
      };
    } else {
      throw new Error('Invalid stats peroid');
    }
  }, [statsPeriod, volume, volumeScale]);

  const volumeTotal = useMemo(() => {
    // TODO: change to actual one
    if (!volume) return null;
    return volume.total_volume.toJsNumber() / volumeScale;
  }, [statsPeriod, volume, volumeScale]);

  const switchToOtherPeriod = useCallback((v: string | number) => {
    setStatsPeriod(v as Peroid);
  }, []);

  const { hippoAgg } = useHippoClient();

  useEffect(() => {
    (async () => {
      if (hippoAgg) {
        const vol = await hippoAgg.app.hippo_aggregator.volume.loadVolume(
          hippo_aggregator.Volume.moduleAddress
        );
        setVolume(vol);
      }
    })();
  }, [hippoAgg]);

  return (
    <div className="max-w-[1321px] mx-auto mt-[106px] tablet:mt-[64px] mobile:mt-[32px]">
      <div className="mb-6 flex items-end tablet:flex-col tablet:items-start tablet:gap-y-2">
        <div className="h3 mr-auto mobile:h5">HIPPO Stats Overview</div>
        <Segmented
          className={classNames('shadow-main bg-secondary', styles.segmentedSelector)}
          options={Periods as unknown as string[]}
          value={statsPeriod}
          onChange={switchToOtherPeriod}
        />
      </div>
      <div className="flex items-start tablet:flex-col tablet:items-start tablet:gap-y-2 mobile:gap-y-4">
        {volumeInPeriod && volumeTotal ? (
          <>
            <div className="mr-auto">
              <div className="h-6 font-bold mb-3 tablet:mb-1">Trading Volume {statsPeriod}</div>
              <div className="textLargeNormal text-grey-500">{volumeInPeriod.peroid}</div>
            </div>
            <div>
              <div className="h2 mobile:h5 mb-3 tablet:mb-1">
                ${numberGroupFormat(volumeInPeriod.amount, 0)}
              </div>
              <div className="textLargeNormal text-grey-500 font-[500] text-right tablet:text-left">
                ${numberGroupFormat(volumeTotal, 0)} Total Volume
              </div>
            </div>
          </>
        ) : (
          <Skeleton active />
        )}
      </div>
      <div className="w-full pt-[66px]">
        <VolumeChart data={historyVolumes} />
      </div>
      <div className="flex justify-between mt-40 mb-20 gap-y-20 tablet:flex-col tablet:items-center">
        <TopList
          className="w-full max-w-[542px]"
          title="Top Trading Pairs"
          cols={['# Name', `${statsPeriod} Volume`]}
          datas={topTradingPairs2}
          flexs={[2, 1]}
        />
        <TopList
          className="w-full max-w-[542px]"
          title="Top Pool Providers"
          cols={['# Pool Provider', `${statsPeriod} Volume`]}
          datas={topPoolProviders2}
          flexs={[2, 1]}
        />
      </div>
    </div>
  );
};

export default Stats;
