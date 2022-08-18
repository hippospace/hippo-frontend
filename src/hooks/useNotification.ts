import { notification } from 'components/Antd';

export const useNotification = () => {
  const openNotification = (description: any) => {
    notification.open({
      message: 'Transaction Success',
      description,
      placement: 'bottomLeft'
    });
  };

  return {
    openNotification
  };
};
