import {createOptions, CreateOptionsOption} from '@thisbeyond/solid-select'
import "@thisbeyond/solid-select/style.css";
import {Emote, EmoteGroup} from './seasonal-query'

import seasonalPanelStyle from '../seasonal-panel.module.scss'

export type EmoteGroupWithParentName = Omit<EmoteGroup, 'emotes'> & {
  id: any,
  emotes: EmoteGroup['emotes'] | [false, Emote][]
  group: string
  groupId: string
}

export const createGroupedOptions = (groups: ({ name: string, id: string, options: EmoteGroup[] })[]) => {
  const values = groups.reduce<EmoteGroupWithParentName[]>((values, group) => {
    values.push(
      ...group.options.map((item) => ({...item, group: group.name, groupId: group.id})),
    );
    return values;
  }, []);

  const props = createOptions(values, {key: "name"});
  const originalOptions = props.options;
  const originalIsDisabled = props.isOptionDisabled;

  props.options = (inputValue) => {
    const options = originalOptions(inputValue);

    const grouped = options.reduce((result, item) => {
      if (Array.isArray(item.value)) return result
      const group = item.value.group;
      if (!group) return result;
      if (!result.has(group)) result.set(group, []);
      result.get(group)?.push(item);
      return result;
    }, new Map<string, CreateOptionsOption<EmoteGroupWithParentName>[]>());

    const groupedOptions: CreateOptionsOption<EmoteGroupWithParentName>[] = [];
    for (const [groupName, options] of grouped.entries()) {
      const option0 = options.shift() as CreateOptionsOption;
      groupedOptions.push({
        ...option0,
        label: <>
          <span class={seasonalPanelStyle.groupLabel}>{groupName}</span>
          <span>{option0.text}</span>
        </>,
      });
      groupedOptions.push(...options);
    }

    return groupedOptions

    /*return values
      .filter(value => !groupedOptions.some(option => option.value.name === value.name))
      .map(value => options.find(option => option.value.name === value.name))
      .concat(groupedOptions) as CreateOptionsOption[];*/
  };

  props.isOptionDisabled = (option) => {
    if (!option) return true
    return originalIsDisabled(option)
  }

  return props;
};
