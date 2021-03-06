import SearchInput from 'components/SearchInput';
import { getPoolFilters } from 'modules/pool/reducer';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import poolAction from 'modules/pool/actions';
import SelectInput from 'components/SelectInput';
import SwitchInput from 'components/SwitchInput';

const filterOptions = [
  {
    label: 'Select filter',
    value: ''
  },
  {
    label: 'token',
    value: 'token'
  }
];

const FilterPanel: React.FC = () => {
  const filterParams = useSelector(getPoolFilters);
  const dispatch = useDispatch();

  const handleOnChange = useCallback(
    (value: string | boolean, name: string) => {
      dispatch(
        poolAction.SET_FILTERS({
          ...filterParams,
          [name]: typeof value === 'string' ? value.toLowerCase() : value
        })
      );
    },
    [dispatch, filterParams]
  );

  return (
    <div className="flex flex-col gap-10">
      <SearchInput
        name="search"
        value={filterParams.search}
        onChange={(e) => handleOnChange(e.target.value, e.target.name)}
      />
      <div className="flex gap-3 items-center">
        <div className="paragraph bold text-grey-900">Filter</div>
        <SelectInput
          value={filterParams.filterBy}
          options={filterOptions}
          onChange={(value) => handleOnChange(value, 'filterBy')}
        />
      </div>
      <div className="flex gap-3 items-center">
        <div className="paragraph bold text-grey-900">Sort</div>
        <SelectInput
          value={filterParams.sortBy}
          options={filterOptions}
          onChange={(value) => handleOnChange(value, 'sortBy')}
        />
      </div>
      <div className="flex gap-3 items-center w-full justify-between">
        <div className="paragraph bold text-grey-900">Show My Liquidity</div>
        <SwitchInput
          checked={filterParams.showSelfLiquidity}
          onChange={(checked) => handleOnChange(checked, 'showSelfLiquidity')}
        />
      </div>
    </div>
  );
};

export default FilterPanel;
