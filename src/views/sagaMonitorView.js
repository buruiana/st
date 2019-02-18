import React from 'react';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import 'react-calendar-timeline/lib/Timeline.css';
import './styles.css';

const SagaMonitorView = props => {
  console.log('console: propspropsprops', props);

  const getRandomColor = () => {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16);
  }

  const filterData = flat => {
    let filteredArray = [];
    let idx = 1;
    Object.entries(flat).forEach(k => {
      const e = k[1];
      if (isEmpty(e.name)) {
        e.title = 'z' + idx + ' - ACTION: ' + get(e, 'action.payload.pathname', ' - ') + get(e, 'action.type', '');
        e.effectId = get(e, 'action.type', 'aaa');
        e.start = e.time;
        e.end = e.time;
        filteredArray.push(e);
      }

      if (e.name === 'effectTriggered' && (!isEmpty(get(e, 'effect["PUT"]')) || !isEmpty(get(e, 'effect["FORK"].args')) || !isEmpty(get(e, 'effect["TAKE"].pattern')))) {
        // if (!isEmpty(get(e, 'effect["FORK"].args'))) {
        //   e.title = 'FORK: ' + get(e.effect["FORK"], 'args[0].type', e.effect["FORK"].args[0]) + ' ' + get(e.effect["FORK"], 'args[1].name', '');
        //   filteredArray.push(e);
        // }
        if (!isEmpty(get(e, 'effect["PUT"]'))) {
          let putParent = {};
          Object.entries(flat).forEach(el => {
            if (el[1].effectId === e.parentEffectId) putParent = el[1];
          });
          console.log('console: putParent', putParent);
          let watcher, action = '';
          if (!isEmpty(putParent)) {
            console.log('console: putParent', putParent);
            if (has(putParent, 'effect["FORK"]')) watcher = putParent.effect["FORK"].fn.name;
            if (has(putParent, 'effect["FORK"]')) action = putParent.effect["FORK"].args[0].type;
          }
          e.groupData = idx + ' - ' + action + ' - ' + watcher + ' PUT: ' + get(e.effect["PUT"], 'action.type');
          e.title = idx + ' - ' + action+ ' - ' + watcher + ' PUT: ' + get(e.effect["PUT"], 'action.type');
          filteredArray.push(e);
        }
        // if (!isEmpty(get(e, 'effect["TAKE"].pattern'))) {
        //   e.title = 'TAKE: ' + e.effect["TAKE"].pattern;
        //   filteredArray.push(e);
        // }
      }
      if (e.name === 'effectResolved' && (!isEmpty(get(e, 'result.type')) || !isEmpty(get(e, 'result.name')))) {
        const obj = Object.entries(flat).forEach(el => (has(e, 'result.type') && has(el[1], 'action.type') && e.result.type === el.action.type && el[1].name === 'actionDispatched'));
        console.log('console: obj', obj);
        if (!isEmpty(obj)) obj[0].end_time = e.time;
        //console.log('console: obj', obj);
        // if (e.result.name !== 'rootSaga' && e.result.name !== 'sagas' && e.result.name !== 'takeLatest') {
        //   e.title = 'RESOLVED: ' + get(e, 'result.name', '') + get(e, 'result.type', '');
        //   filteredArray.push(e);
        // }
      }
      idx++;
    });
    return sortBy(filteredArray, ['start', 'title']);
  };

  const getData = saga => {
    console.log('console: saga', saga);
    if (isEmpty(saga)) saga = [];
    const data = [];

    Object.entries(saga).forEach(k => {
      const newEl = {};
      const e = k[1];

      newEl.id = e.effectId;
      newEl.group = e.parentEffectId || '';
      newEl.group = e.effectId;
      newEl.title = e.title;
      newEl.start_time = moment(new Date(e.start));
      newEl.end_time = moment(new Date(e.end));
      newEl.canMove = false;
      newEl.canResize = false;
      newEl.canChangeGroup = false;
      newEl.color = getRandomColor();
      newEl.selectedBgColor = getRandomColor();
      newEl.bgColor = getRandomColor();
      newEl.style = {
        backgroundColor: getRandomColor()
      };
      newEl.details = e;

      data.push(newEl);

    })
    return data;
  };

  const getGroups = saga => {
    if (isEmpty(saga)) saga = [];
    const group = [];
    Object.entries(saga).forEach(k => {
      const e = k[1];
      group.push({
        id: e.effectId,
        title: e.title,
        stackItems: true,
        height: 40
      });
    });
    return group;
  };

  const getFullObj = () => {
    const fullObj = [ ...props.state.dispatchedActions];
    Object.entries(props.state.effectsById).forEach(k => {
      fullObj.push(k[1]);
    });
    return fullObj;
  }

  const filtered = filterData(getFullObj());
  console.log('console: -------', getGroups(filtered));
  console.log('console: ----1---', getData(filtered));
  return (
    <div style={{background: 'white'}}>
      <Timeline
        groups={getGroups(filtered)}
        sidebarWidth={300}
        items={getData(filtered)}
        defaultTimeStart={moment().add(-1, 'minute')}
        defaultTimeEnd={moment().add(1, 'minute')}
        //dimensions={{ width: '1000px' }}
        //onItemClick={onItemClick}
      />
    </div>

  );
};

export default SagaMonitorView;