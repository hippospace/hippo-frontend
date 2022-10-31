import { Tooltip } from 'antd';
import { TooltipPropsWithOverlay } from 'antd/lib/tooltip';
import classNames from 'classnames';
import React from 'react';
import { QuestionIcon } from 'resources/icons';

interface IHintProps extends TooltipPropsWithOverlay {
  content: string;
}

const Hint: React.FC<IHintProps> = (props) => {
  const { content, className, ...rest } = props;
  return (
    <Tooltip title={content} {...rest}>
      <QuestionIcon className={classNames('font-icon', className)} />
    </Tooltip>
  );
};

export default Hint;
