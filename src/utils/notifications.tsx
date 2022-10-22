import { MaybeHexString } from 'aptos';
import { notification } from 'components/Antd';
import TextLink from 'components/TextLink';
import { ReactNode } from 'react';
import { CloseIcon, NotiErrorIcon, NotiInfoIcon, NotiSuccessIcon } from 'resources/icons';

type NotificationType = 'success' | 'error' | 'info' | 'warn';

interface INotificationArgs {
  detail: ReactNode;
  type?: NotificationType;
  title?: ReactNode;
  duration?: number;
}

const openNotification = ({ detail, type = 'success', title = '' }: INotificationArgs) => {
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
    duration: 6,
    maxCount: 5
  });
};

export const openErrorNotification = (args: INotificationArgs) =>
  openNotification({ type: 'error', ...args });

export const openTxSuccessNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={`https://explorer.aptoslabs.com/txn/${txHash}`}>View transaction</TextLink>
    </p>
  );
  return openNotification({ detail, title: 'Transaction Success' });
};

export const openTxErrorNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={`https://explorer.aptoslabs.com/txn/${txHash}`}>View transaction</TextLink>
    </p>
  );
  return openNotification({ type: 'error', detail, title: 'Transaction Failed' });
};

export const openTxPendingNotification = (txHash: MaybeHexString, content: string) => {
  const detail = (
    <p>
      <div>{content}</div>
      <TextLink href={`https://explorer.aptoslabs.com/txn/${txHash}`}>View transaction</TextLink>
    </p>
  );
  return openNotification({ type: 'info', detail, title: 'Transaction Pending' });
};

export default openNotification;
