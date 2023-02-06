import { MaybeHexString } from 'aptos';
import { notification } from 'components/Antd';
import TextLink from 'components/TextLink';
import { ReactNode } from 'react';
import { CloseIcon, NotiErrorIcon, NotiInfoIcon, NotiSuccessIcon } from 'resources/icons';
import { HttpError } from 'types/hippo';
import { txExplorerUrl } from './utility';

type NotificationType = 'success' | 'error' | 'info' | 'warn';

interface INotificationArgs {
  detail: ReactNode;
  type?: NotificationType;
  title?: ReactNode;
  duration?: number;
}

const openNotification = ({
  detail,
  type = 'success',
  title = '',
  duration = 6
}: INotificationArgs) => {
  if (!title) {
    title = type[0].toUpperCase() + type.slice(1);
  }

  let icon: ReactNode;
  if (type === 'success') {
    icon = <NotiSuccessIcon />;
  } else if (type === 'error') {
    icon = <NotiErrorIcon />;
  } else if (type === 'info') {
    icon = <NotiInfoIcon />;
  }

  notification.open({
    message: title,
    description: detail,
    placement: 'bottomLeft',
    icon,
    className: `hippo-notification hippo-notification--${type}`,
    closeIcon: <CloseIcon className="font-icon h5 text-grey-500" />,
    duration,
    maxCount: 3
  });
};

export const openHttpErrorNotification = (error: unknown) => {
  if (error instanceof HttpError) {
    openErrorNotification({ detail: `${error.status} ${error.info.error ?? error.info.message}` });
  } else {
    openErrorNotification({ detail: 'Unknown error' });
  }
};

export const openErrorNotification = (args: INotificationArgs) =>
  openNotification({ type: 'error', ...args });

export const openTxSuccessNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={txExplorerUrl(txHash)}>View transaction</TextLink>
    </p>
  );
  return openNotification({ detail, title: 'Transaction Success' });
};

export const openTxErrorNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={txExplorerUrl(txHash)}>View transaction</TextLink>
    </p>
  );
  return openNotification({ type: 'error', detail, title: 'Transaction Failed' });
};

export const openTxPendingNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={txExplorerUrl(txHash)}>View transaction</TextLink>
    </p>
  );
  return openNotification({ type: 'info', detail, title: 'Transaction Pending' });
};

export default openNotification;
