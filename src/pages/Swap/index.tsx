import { Drawer } from 'components/Antd';
import Card from 'components/Card';
import { Formik, FormikHelpers, useFormikContext } from 'formik';
import { useCallback, useState } from 'react';
import * as yup from 'yup';
import { SettingIcon } from 'resources/icons';
import SwapSetting from './components/SwapSetting';
import { useSelector } from 'react-redux';
import { getSwapSettings } from 'modules/swap/reducer';
import TokenSwap from './components/TokenSwap';
import useHippoClient from 'hooks/useHippoClient';
import { ISwapSettings } from './types';
import classNames from 'classnames';
import Button from 'components/Button';

const validationSchema = yup.object({
  // currencyFrom: yup.object().shape({
  //   // token: yup.required(),
  //   amount: yup.number().required(),
  //   balance: yup.number().required()
  // }),
  // currencyTo: yup.object().shape({
  //   // token: yup.required(),
  //   amount: yup.number().required(),
  //   balance: yup.number().required()
  // })
  currencyFrom: yup.object({
    // token: yup.required(),
    amount: yup.number().required(),
    balance: yup.number().required()
  })
});

const SettingsButton = ({
  className = '',
  onClick
}: {
  className?: string;
  onClick: () => void;
}) => {
  const { values } = useFormikContext<ISwapSettings>();
  return (
    <Button
      className={classNames('!h-full !pr-2 !pl-3  text-grey-700 largeTextNormal', className)}
      variant="icon"
      onClick={onClick}>
      {values.slipTolerance}% <SettingIcon className="font-icon h5 ml-1" />
    </Button>
  );
};

const CardHeader = ({ className = '' }: { className?: string }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTxSettingsOpen, setIsMobileTxSettingsOpen] = useState(false);
  return (
    <div className={classNames('w-full flex h-10 items-center mb-1', className)}>
      <Card className="ml-auto h-full relative w-fit">
        <SettingsButton
          className="tablet:hidden mobile:hidden"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        />
        <SettingsButton
          className="cursor-pointer hidden mobile:block tablet:block"
          onClick={() => setIsMobileTxSettingsOpen(true)}
        />
        <Card
          className={classNames(
            'absolute top-11 w-[400px] -right-[420px] px-8 laptop:w-[368px] laptop:-right-[calc(368px+20px)] py-8 laptop:px-4 mobile:hidden tablet:hidden scale-[50%] origin-top-left opacity-0 transition-all',
            { '!opacity-100 !scale-100': isSettingsOpen }
          )}>
          <SwapSetting onClose={() => setIsSettingsOpen(false)} />
        </Card>
      </Card>
      <Drawer
        height={'auto'}
        title={<div className="paragraph bold text-black">Transaction Settings</div>}
        placement={'bottom'}
        onClose={() => setIsMobileTxSettingsOpen(false)}
        visible={isMobileTxSettingsOpen}>
        <SwapSetting onClose={() => setIsMobileTxSettingsOpen(false)} />
      </Drawer>
    </div>
  );
};

const Swap: React.FC = () => {
  const swapSettings = useSelector(getSwapSettings);
  const { requestSwapByRoute } = useHippoClient();

  const onSubmitSwap = useCallback(
    async (values: ISwapSettings, formikHelper: FormikHelpers<ISwapSettings>) => {
      const fromSymbol = values.currencyFrom?.token?.symbol.str();
      const toSymbol = values.currencyTo?.token?.symbol.str();
      const fromUiAmt = values.currencyFrom?.amount;
      if (fromSymbol && toSymbol && fromUiAmt) {
        const quote = values.quoteChosen;
        if (quote) {
          await requestSwapByRoute(quote, values.slipTolerance);
          formikHelper.setSubmitting(false);
        } else {
          // TODO: info bubble "route note available"
        }
      }
    },
    [requestSwapByRoute]
  );

  return (
    <div className="w-full mt-6 max-w-[463px] mx-auto flex flex-col justify-center items-center h-full relative pointer-events-none">
      <Formik
        initialValues={swapSettings}
        validationSchema={validationSchema}
        onSubmit={onSubmitSwap}>
        <>
          <CardHeader className="pointer-events-auto" />
          <Card className="w-full min-h-[430px] flex flex-col py-8 relative pointer-events-auto">
            <TokenSwap />
          </Card>
        </>
      </Formik>
    </div>
  );
};

export default Swap;
