import { Popover } from 'components/Antd';
import Card from 'components/Card';
import { Formik, FormikHelpers } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import * as yup from 'yup';
import { SettingIcon } from 'resources/icons';
import SwapSetting from './components/SwapSetting';
import styles from './Swap.module.scss';
import { useSelector } from 'react-redux';
import { getSwapSettings } from 'modules/swap/reducer';
import TokenSwap from './components/TokenSwap';
import useHippoClient from 'hooks/useHippoClient';
import { ISwapSettings } from './types';

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

const Swap: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const swapSettings = useSelector(getSwapSettings);
  const { hippoSwap, hippoWallet, requestSwapByRoute } = useHippoClient();

  const renderCardHeader = useMemo(
    () => (
      <div className="absolute w-14 h-14 rounded-xxl shadow-swap top-0 -right-16 flex justify-center align-center bg-secondary">
        <Popover
          overlayClassName={styles.popover}
          trigger="click"
          visible={isVisible}
          onVisibleChange={(visible) => setIsVisible(visible)}
          content={<SwapSetting onClose={() => setIsVisible(false)} />}
          placement="rightBottom">
          <button className="cursor-pointer">
            <SettingIcon />
          </button>
        </Popover>
      </div>
    ),
    [setIsVisible, isVisible]
  );

  const onSubmitSwap = useCallback(
    (values: ISwapSettings, formikHelper: FormikHelpers<ISwapSettings>) => {
      const fromSymbol = values.currencyFrom?.token?.symbol.str();
      const toSymbol = values.currencyTo?.token?.symbol.str();
      const fromUiAmt = values.currencyFrom?.amount;
      if (hippoSwap && hippoWallet && fromSymbol && toSymbol && fromUiAmt) {
        const quote = values.quoteChosen;
        if (quote) {
          requestSwapByRoute(quote, values.slipTolerance, () => {
            formikHelper.setSubmitting(false);
            formikHelper.setFieldValue('currencyFrom', {
              ...values.currencyTo,
              amount: 0
            });
          });
        } else {
          // TODO: info bubble "route note available"
        }
      }
    },
    [hippoSwap, hippoWallet, requestSwapByRoute]
  );

  return (
    <div className="w-full flex justify-center items-center h-full relative">
      <Formik
        initialValues={swapSettings}
        validationSchema={validationSchema}
        onSubmit={onSubmitSwap}>
        <Card className="w-[497px] min-h-[430px] flex flex-col py-10 shadow-swap rounded-xxl relative">
          <TokenSwap />
          {renderCardHeader}
        </Card>
      </Formik>
    </div>
  );
};

export default Swap;
