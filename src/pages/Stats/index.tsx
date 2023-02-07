import { AggregatorTypes, hippo_aggregator } from '@manahippo/hippo-sdk';
import { Segmented, Skeleton } from 'antd';
import classNames from 'classnames';
import PoolProvider, { poolUrl } from 'components/PoolProvider';
import {
  numberGroupFormat,
  numberOfAbbr,
  percent
} from 'components/PositiveFloatNumInput/numberFormats';
import TradingPair from 'components/TradingPair';
import useHippoClient from 'hooks/useHippoClient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays } from 'utils/utility';
import styles from './Stats.module.scss';
import TopList from './TopList';
import VolumeChart from './VolumeChart';
import useSWR from 'swr';
import { ILpPriceChange, LpPriceChangePeriod } from 'types/hippo';

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

const fetcher = (apiURL: string) => fetch(apiURL).then((res) => res.json());

const TopLpPriceChanges = () => {
  const { hippoAgg } = useHippoClient();
  const [peroidSelected, setPeriodSelected] = useState(LpPriceChangePeriod['6H']);
  const key = `https://api.hippo.space/v1/lptracking/all/price/changes/order/by/${peroidSelected}?limit=10000`;
  const { data } = useSWR<ILpPriceChange[]>(key, fetcher);
  const data2 =
    data
      ?.filter((d) => d.lp.includes('APT') && d.lp.includes('USDC'))
      ?.map((d, i) => {
        const base = hippoAgg?.coinListClient.getCoinInfoBySymbol(d.lp.split('-')[0])[0]?.token_type
          .type;
        const quote = hippoAgg?.coinListClient.getCoinInfoBySymbol(d.lp.split('-')[1])[0]
          ?.token_type.type;
        return [
          <PoolProvider
            className={'h-[65px]'}
            key={i}
            dexType={AggregatorTypes.DexType[d.dex as keyof typeof AggregatorTypes.DexType]}
          />,
          <>
            {base && quote && <TradingPair key={i} base={base} quote={quote} seperator={' - '} />}
          </>,
          <span key={i} className="body-bold text-grey-700">
            {percent(d.priceChanges[LpPriceChangePeriod['6H']] ?? '-')}
          </span>,
          <span key={i} className="body-bold text-grey-700">
            {percent(d.priceChanges[LpPriceChangePeriod['1D']] ?? '-')}
          </span>,
          <span key={i} className="body-bold text-grey-700">
            {percent(d.priceChanges[LpPriceChangePeriod['7D']] ?? '-')}
          </span>
        ];
      }) || [];

  const cols = [
    [LpPriceChangePeriod['6H'], '6H Change (%)', true],
    [LpPriceChangePeriod['1D'], '1D Change (%)', true],
    [LpPriceChangePeriod['7D'], '7D Change (%)', false]
  ].map((a, i) => (
    <span
      className={classNames('cursor-pointer', {
        'text-prime-500': peroidSelected === a[0],
        'pointer-events-none': !a[2]
      })}
      key={i}
      onClick={() => setPeriodSelected(a[0] as LpPriceChangePeriod)}>
      {a[1]}
    </span>
  ));
  return (
    <div className="">
      <TopList
        title="Top Lp Prices Change"
        cols={['Dex', 'LP', ...cols]}
        flexs={[3, 4, 2, 2, 2]}
        datas={data2}></TopList>
    </div>
  );
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
          <div
            className="cursor-pointer"
            onClick={() => window.open(poolUrl(pp.dex_type.toJsNumber()), '_blank')}>
            <PoolProvider dexType={pp.dex_type.toJsNumber()} />
          </div>
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
    if (!volume) return null;
    return volume.total_volume.toJsNumber() / volumeScale;
  }, [volume, volumeScale]);

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
      <div className="mb-8 tablet:mb-4 flex items-end tablet:flex-col tablet:items-start tablet:gap-y-8">
        <div className="mr-auto">
          <div className="h3 mb-2 mobile:h5 text-grey-500">HIPPO Stats Overview</div>
          {volumeTotal && (
            <div className="h2 mobile:h4">Total Volume ${numberGroupFormat(volumeTotal, 0)}</div>
          )}
        </div>
        <Segmented
          className={classNames('shadow-main bg-surface', styles.segmentedSelector)}
          options={Periods as unknown as string[]}
          value={statsPeriod}
          onChange={switchToOtherPeriod}
        />
      </div>
      <div className="flex items-start tablet:flex-col tablet:items-start tablet:gap-y-2 mobile:gap-y-4">
        {volumeInPeriod && volumeTotal ? (
          <>
            <div className="mr-auto">
              <div className="h6 mobile:subtitle-bold font-bold mb-3 tablet:mb-1">
                Trading Volume {statsPeriod}
              </div>
              <div className="textLargeNormal text-grey-500">{volumeInPeriod.peroid}</div>
            </div>
            <div>
              <div className="h4 mobile:h5 mb-3 tablet:mb-1">
                ${numberGroupFormat(volumeInPeriod.amount, 0)}
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
      <TopLpPriceChanges />
    </div>
  );
};

export default Stats;
