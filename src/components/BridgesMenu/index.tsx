export interface IBridgeItemProps {
  name: string;
  iconSrc: string;
  url: string;
}

const BridgeItem = ({ name, iconSrc, url }: IBridgeItemProps) => {
  return (
    <div
      className="flex items-center w-[176px] h-9 rounded-full px-2 cursor-pointer gap-x-2 hover:bg-prime-700/10 text-grey-700 dark:hover:bg-prime-400/10"
      onClick={() => window.open(url, '_blank')}>
      <img src={iconSrc} className="w-6 h-6 rounded-full" />
      <div className="text-grey-700 body-bold">{name}</div>
    </div>
  );
};

const BridgesMenu = ({ bridges }: { bridges: IBridgeItemProps[] }) => {
  return (
    <div className="text-grey-700 body-bold rounded-xxl">
      <div className="space-y-2">
        <div className="px-2">Bridge</div>
        {bridges.map((b, i) => (
          <BridgeItem {...b} key={i} />
        ))}
      </div>
    </div>
  );
};

export default BridgesMenu;
