import { Formik, FormikHelpers } from 'formik';
import { useCallback } from 'react';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { getSwapSettings } from 'modules/swap/reducer';
import TokenSwap from './components/TokenSwap';
import useHippoClient from 'hooks/useHippoClient';
import { ISwapSettings } from './types';
import { Types } from 'aptos';

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
          const options: Partial<Types.SubmitTransactionRequest> = {
            expiration_timestamp_secs:
              '' + (Math.floor(Date.now() / 1000) + values.trasactionDeadline),
            max_gas_amount: '' + values.maxGasFee
          };
          const result = await requestSwapByRoute(quote, values.slipTolerance, options);
          if (result) {
            formikHelper.setFieldValue('currencyFrom', {
              ...values.currencyFrom,
              amount: 0
            });
          }
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
        <TokenSwap />
      </Formik>
    </div>
  );
};

export default Swap;
